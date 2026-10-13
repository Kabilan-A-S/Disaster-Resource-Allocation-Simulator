package disaster.simulation;

import java.util.*;
import disaster.disaster.Disaster;
import disaster.zone.Zone;
import disaster.resource.*;
import disaster.allocation.*;
import disaster.rescue.*;

public class SimulationEngine {
    private final Disaster disaster;
    private final List<Zone> zones;
    private final Map<String, Resource> resources;
    private final int teams;
    private final String runId;
    private java.util.function.Consumer<SimulationEngine> onCompleteCallback = null;

    public void setOnComplete(java.util.function.Consumer<SimulationEngine> cb) {
        this.onCompleteCallback = cb;
    }

    private int currentHour = 0;
    private String state = "CONFIGURED"; // CONFIGURED, STARTING, RUNNING, COMPLETED, FAILED
    private String stage = "Disaster initialized";
    private int progress = 0;
    
    private SimulationResult finalResult = null;

    public SimulationEngine(String runId, Disaster d, List<Zone> z, Map<String, Resource> r, int teams) {
        this.runId = runId;
        this.disaster = d;
        this.zones = new ArrayList<>(z);
        this.resources = r;
        this.teams = teams;
    }

    public SimulationEngine(Disaster d, List<Zone> z, Map<String, Resource> r, int teams) {
        this("TEST-" + System.currentTimeMillis(), d, z, r, teams);
    }

    public SimulationResult run() {
        try {
            runSimulationSynchronous();
            return getFinalResult();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        }
    }

    public synchronized void startAsync() {
        if (!state.equals("CONFIGURED")) return;
        state = "STARTING";
        
        Thread simThread = new Thread(() -> {
            try {
                runSimulation();
            } catch (Exception e) {
                synchronized(this) {
                    state = "FAILED";
                    stage = "Simulation failed: " + e.getMessage();
                }
            }
        });
        simThread.setDaemon(true);
        simThread.start();
    }
    
    private void updateState(int hour, int prog, String stg) {
        synchronized(this) {
            this.currentHour = hour;
            this.progress = prog;
            this.stage = stg;
        }
    }

    private void runSimulation() throws InterruptedException {
        synchronized(this) { state = "RUNNING"; }
        updateState(0, 5, "Zones identified");
        Thread.sleep(300); // UI visual padding
        
        updateState(6, 25, "Requirements calculated & Zones prioritised");
        int percent = disaster.getDemandPercent();
        int hours = disaster.getDurationHours();
        
        Collections.sort(zones); // Priority sort
        Thread.sleep(300);
        
        updateState(12, 50, "Resources allocated");
        ResourceAllocator allocator = new ResourceAllocator();
        List<AllocationRecord> water = allocator.allocateBestEffort(resources.get("Water"), zones, hours, percent);
        List<AllocationRecord> food = allocator.allocateBestEffort(resources.get("Food"), zones, hours, percent);
        List<AllocationRecord> med = allocator.allocateBestEffort(resources.get("Medicine"), zones, hours, percent);
        List<AllocationRecord> fuel = allocator.allocateBestEffort(resources.get("Fuel"), zones, hours, percent);
        
        SimulationResult result = new SimulationResult(water, zones.stream().mapToInt(Zone::getTeamsRequired).sum(), teams);
        result.resources.put("Water", aggregate(water, resources.get("Water").getOriginalQuantity()));
        result.resources.put("Food", aggregate(food, resources.get("Food").getOriginalQuantity()));
        result.resources.put("Medicine", aggregate(med, resources.get("Medicine").getOriginalQuantity()));
        result.resources.put("Fuel", aggregate(fuel, resources.get("Fuel").getOriginalQuantity()));
        
        Thread.sleep(300);
        updateState(18, 75, "Rescue operations running");
        
        // Multi-threading Rescue tasks
        TeamPool pool = new TeamPool(teams);
        List<Thread> rescueThreads = new ArrayList<>();
        for (Zone z : zones) {
            Thread t = new Thread(new RescueTask(pool, z));
            rescueThreads.add(t);
            t.start();
        }
        
        for (Thread t : rescueThreads) {
            t.join();
        }
        
        Thread.sleep(300);
        updateState(24, 100, "Completed");
        
        synchronized(this) {
            this.finalResult = result;
            this.state = "COMPLETED";
            if (onCompleteCallback != null) {
                try {
                    onCompleteCallback.accept(this);
                } catch (Exception ignored) {}
            }
        }
    }

    public void runSimulationSynchronous() throws InterruptedException {
        int percent = disaster.getDemandPercent();
        int hours = disaster.getDurationHours();
        Collections.sort(zones);
        ResourceAllocator allocator = new ResourceAllocator();
        List<AllocationRecord> water = allocator.allocateBestEffort(resources.get("Water"), zones, hours, percent);
        List<AllocationRecord> food = allocator.allocateBestEffort(resources.get("Food"), zones, hours, percent);
        List<AllocationRecord> med = allocator.allocateBestEffort(resources.get("Medicine"), zones, hours, percent);
        List<AllocationRecord> fuel = allocator.allocateBestEffort(resources.get("Fuel"), zones, hours, percent);
        
        SimulationResult result = new SimulationResult(water, zones.stream().mapToInt(Zone::getTeamsRequired).sum(), teams);
        result.resources.put("Water", aggregate(water, resources.get("Water").getOriginalQuantity()));
        result.resources.put("Food", aggregate(food, resources.get("Food").getOriginalQuantity()));
        result.resources.put("Medicine", aggregate(med, resources.get("Medicine").getOriginalQuantity()));
        result.resources.put("Fuel", aggregate(fuel, resources.get("Fuel").getOriginalQuantity()));
        
        TeamPool pool = new TeamPool(teams);
        List<Thread> rescueThreads = new ArrayList<>();
        for (Zone z : zones) {
            Thread t = new Thread(new RescueTask(pool, z));
            rescueThreads.add(t);
            t.start();
        }
        for (Thread t : rescueThreads) { t.join(); }
        this.finalResult = result;
        this.state = "COMPLETED";
        if (onCompleteCallback != null) {
            try {
                onCompleteCallback.accept(this);
            } catch (Exception ignored) {}
        }
    }

    public int getTeams() {
        return teams;
    }

    public int getAverageResponseTime() {
        if (zones.isEmpty()) return 0;
        return zones.stream().mapToInt(Zone::getResponseMinutes).sum() / zones.size();
    }
    
    public int getAverageWaitTime() {
        if (zones.isEmpty()) return 0;
        return zones.stream().mapToInt(Zone::getWaitMinutes).sum() / zones.size();
    }
    
    public Disaster getDisaster() { return disaster; }
    public Map<String, Resource> getOriginalResources() { return resources; }
    public synchronized String getState() { return state; }
    
    private long[] aggregate(List<AllocationRecord> allocs, long available) {
        long req = allocs.stream().mapToLong(AllocationRecord::required).sum();
        long all = allocs.stream().mapToLong(AllocationRecord::allocated).sum();
        return new long[]{req, available, all, req - all};
    }

    public synchronized Map<String, Object> getStatus() {
        Map<String, Object> map = new HashMap<>();
        map.put("runId", runId);
        map.put("status", state);
        map.put("state", state);
        map.put("stage", stage);
        map.put("progress", progress);
        map.put("currentHour", currentHour);
        return map;
    }
    
    public synchronized SimulationResult getFinalResult() {
        return finalResult;
    }
    
    public List<Zone> getZones() {
        return zones;
    }
    
    public String getRunId() {
        return runId;
    }
}

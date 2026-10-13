package disaster.server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import disaster.disaster.*;
import disaster.file.FileManager;
import disaster.interfaces.DataStore;
import disaster.resource.*;
import disaster.simulation.SimulationEngine;
import disaster.simulation.SimulationResult;
import disaster.zone.Zone;
import disaster.zone.ZoneService;
import disaster.util.Json;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

public class ApiServer {
    private final int port;
    private final DataStore store;
    private final ZoneService zoneService;
    
    // Single Source of Truth for the active simulation
    private SimulationEngine currentEngine = null;

    public ApiServer(int port) {
        this.port = port;
        this.store = new FileManager();
        this.zoneService = new ZoneService(this.store);
    }

    public void start() throws IOException {
        try {
            System.out.println("Using zones file: " + store.getZonesFile().getAbsolutePath());
        } catch (Exception e) {
            System.out.println("Zones file location: " + e.getMessage());
        }
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/", new ApiHandler());
        server.setExecutor(null);
        server.start();
        System.out.println("API server listening on http://localhost:" + port);
    }

    private class ApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange x) throws IOException {
            try {
                String path = x.getRequestURI().getPath();
                String method = x.getRequestMethod();

                if (method.equals("OPTIONS")) {
                    send(x, 204, "");
                    return;
                }

                if (path.equals("/api/simulation/start") && method.equals("POST")) {
                    handleStartSimulation(x);
                } else if (path.equals("/api/simulation/status")) {
                    if (currentEngine == null) {
                        send(x, 200, "{\"status\":\"IDLE\",\"state\":\"IDLE\"}");
                    } else {
                        send(x, 200, Json.mapToJson(currentEngine.getStatus()));
                    }
                } else if (path.equals("/api/simulation/results")) {
                    if (currentEngine == null || currentEngine.getFinalResult() == null) {
                        send(x, 404, "{\"error\":\"No completed result\"}");
                    } else {
                        send(x, 200, resultJson(currentEngine));
                    }
                } else if (path.equals("/api/simulation/history/clear") && method.equals("POST")) {
                    handleClearHistory(x);
                } else if ((path.equals("/api/simulation/history") || path.equals("/api/history")) && method.equals("GET")) {
                    handleGetHistory(x);
                } else if (path.equals("/api/zones") && method.equals("GET")) {
                    handleGetZones(x);
                } else if (path.equals("/api/zones/add") && method.equals("POST")) {
                    handleAddZone(x);
                } else if (path.equals("/api/zones/update") && method.equals("POST")) {
                    handleUpdateZone(x);
                } else if (path.equals("/api/zones/delete") && method.equals("POST")) {
                    handleDeleteZone(x);
                } else if (path.equals("/api/zones/reset") && method.equals("POST")) {
                    handleResetZones(x);
                } else if (path.equals("/api/resources")) {
                    if (currentEngine == null || currentEngine.getFinalResult() == null) {
                        Map<String, Resource> stock = store.loadResources();
                        Map<String, long[]> defaultMap = new HashMap<>();
                        for (Map.Entry<String, Resource> e : stock.entrySet()) {
                            defaultMap.put(e.getKey(), new long[]{0, e.getValue().getQuantity(), 0, 0});
                        }
                        send(x, 200, Json.resourceMap(defaultMap));
                    } else {
                        send(x, 200, Json.resourceMap(currentEngine.getFinalResult().resources));
                    }
                } else {
                    send(x, 404, "{\"error\":\"Not found\"}");
                }
            } catch (IllegalStateException e) {
                send(x, 409, "{\"error\":" + Json.quote(e.getMessage()) + "}");
            } catch (IllegalArgumentException e) {
                send(x, 400, "{\"error\":" + Json.quote(e.getMessage()) + "}");
            } catch (Exception e) {
                e.printStackTrace();
                send(x, 500, "{\"error\":" + Json.quote(e.getMessage()) + "}");
            }
        }

        private boolean isSimulationRunning() {
            return currentEngine != null && "RUNNING".equals(currentEngine.getState());
        }

        private void handleGetZones(HttpExchange x) throws IOException {
            // Source of truth is always zoneService.getAllZones()
            List<Zone> masterZones = zoneService.getAllZones();
            if (currentEngine != null && currentEngine.getFinalResult() != null) {
                Map<String, Zone> engineZones = new HashMap<>();
                for (Zone ez : currentEngine.getZones()) {
                    engineZones.put(ez.getId(), ez);
                }
                List<Zone> augmented = new ArrayList<>();
                for (Zone z : masterZones) {
                    Zone ez = engineZones.get(z.getId());
                    augmented.add(ez != null ? ez : z);
                }
                send(x, 200, zonesArrayJson(augmented, true));
            } else {
                send(x, 200, zonesArrayJson(masterZones, false));
            }
        }

        private void handleAddZone(HttpExchange x) throws IOException {
            Map<String, String> f = form(x);
            String name = f.get("zoneName");
            if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Zone name is required");
            long pop = parseLongField(f, "population", "Population");
            int sev = parseIntField(f, "severity", "Severity");
            int med = parseIntField(f, "medicalNeed", "Medical need");
            int dist = parseIntField(f, "distanceKm", "Distance");
            
            List<Zone> updated = zoneService.addZone(name, pop, sev, med, dist, isSimulationRunning());
            send(x, 200, zonesArrayJson(updated, false));
        }

        private void handleUpdateZone(HttpExchange x) throws IOException {
            Map<String, String> f = form(x);
            String id = f.get("zoneId");
            if (id == null || id.trim().isEmpty()) throw new IllegalArgumentException("Zone ID is required");
            String name = f.get("zoneName");
            if (name == null || name.trim().isEmpty()) throw new IllegalArgumentException("Zone name is required");
            long pop = parseLongField(f, "population", "Population");
            int sev = parseIntField(f, "severity", "Severity");
            int med = parseIntField(f, "medicalNeed", "Medical need");
            int dist = parseIntField(f, "distanceKm", "Distance");
            
            List<Zone> updated = zoneService.updateZone(id, name, pop, sev, med, dist, isSimulationRunning());
            send(x, 200, zonesArrayJson(updated, false));
        }

        private void handleDeleteZone(HttpExchange x) throws IOException {
            Map<String, String> f = form(x);
            String id = f.get("zoneId");
            if (id == null || id.trim().isEmpty()) throw new IllegalArgumentException("Zone ID is required");
            
            List<Zone> updated = zoneService.deleteZone(id, isSimulationRunning());
            send(x, 200, zonesArrayJson(updated, false));
        }

        private void handleResetZones(HttpExchange x) throws IOException {
            List<Zone> updated = zoneService.resetToGoldenZones(isSimulationRunning());
            send(x, 200, zonesArrayJson(updated, false));
        }

        private long parseLongField(Map<String, String> f, String key, String label) {
            String val = f.get(key);
            if (val == null || val.trim().isEmpty()) throw new IllegalArgumentException(label + " is required");
            try {
                return Long.parseLong(val.trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(label + " must be a valid number");
            }
        }

        private int parseIntField(Map<String, String> f, String key, String label) {
            String val = f.get(key);
            if (val == null || val.trim().isEmpty()) throw new IllegalArgumentException(label + " is required");
            try {
                return Integer.parseInt(val.trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException(label + " must be a valid integer");
            }
        }

        private void handleStartSimulation(HttpExchange x) throws IOException {
            Map<String, String> f = form(x);
            if (f.isEmpty()) throw new IllegalArgumentException("Empty configuration");

            String dType = f.getOrDefault("disasterType", f.getOrDefault("disaster", "Flood"));
            int severity = Integer.parseInt(f.getOrDefault("severity", "5"));
            int duration = Integer.parseInt(f.getOrDefault("duration", "24"));
            long population = Long.parseLong(f.getOrDefault("population", "50000"));
            
            Disaster d;
            switch (dType) {
                case "Earthquake": d = new Earthquake(severity, duration, population); break;
                case "Cyclone": d = new Cyclone(severity, duration, population); break;
                case "Wildfire": d = new Wildfire(severity, duration, population); break;
                default: d = new Flood(severity, duration, population); break;
            }

            int numZones = Integer.parseInt(f.getOrDefault("zones", "0"));
            List<Zone> zs = new ArrayList<>();
            if (numZones > 0 && f.containsKey("zone_0_name")) {
                long popPerZone = population / numZones;
                for (int i = 0; i < numZones; i++) {
                    String zName = f.getOrDefault("zone_" + i + "_name", "Zone " + (i+1));
                    String popStr = f.getOrDefault("zone_" + i + "_population", "");
                    long zPop = popStr.isEmpty() ? popPerZone : Long.parseLong(popStr);
                    String sevStr = f.getOrDefault("zone_" + i + "_severity", "");
                    int zSev = sevStr.isEmpty() ? severity : Integer.parseInt(sevStr);
                    String medStr = f.getOrDefault("zone_" + i + "_medicalNeed", "");
                    int zMed = medStr.isEmpty() ? 3 : Integer.parseInt(medStr);
                    String distStr = f.getOrDefault("zone_" + i + "_distance", "");
                    int zDist = distStr.isEmpty() ? (10 + i * 5) : Integer.parseInt(distStr);
                    zs.add(new Zone(String.valueOf(i + 1), zName, zPop, zSev, zMed, zDist));
                }
            } else {
                List<Zone> stored = zoneService.getAllZones();
                for (Zone z : stored) {
                    zs.add(new Zone(z.getId(), z.getName(), z.getPopulation(), z.getSeverity(), z.getMedicalNeed(), z.getDistanceKm()));
                }
            }

            Map<String, Resource> res = new HashMap<>();
            res.put("Water", new Water(Long.parseLong(f.getOrDefault("water", "120000"))));
            res.put("Food", new Food(Long.parseLong(f.getOrDefault("food", "130000"))));
            res.put("Medicine", new Medicine(Long.parseLong(f.getOrDefault("medicine", "1500"))));
            res.put("Fuel", new Fuel(Long.parseLong(f.getOrDefault("fuel", "1000"))));
            
            int teams = Integer.parseInt(f.getOrDefault("rescueTeams", f.getOrDefault("teams", "10")));
            
            String runId = "RUN-" + System.currentTimeMillis();
            currentEngine = new SimulationEngine(runId, d, zs, res, teams);
            
            final Disaster simDisaster = d;
            final int simTeams = teams;
            final int simZonesCount = zs.size();
            final long simPop = population;
            final long simTimestamp = System.currentTimeMillis();

            currentEngine.setOnComplete(engine -> {
                try {
                    SimulationResult resObj = engine.getFinalResult();
                    double waterCov = getCoveragePct(resObj.resources.get("Water"));
                    double foodCov = getCoveragePct(resObj.resources.get("Food"));
                    double medCov = getCoveragePct(resObj.resources.get("Medicine"));
                    double fuelCov = getCoveragePct(resObj.resources.get("Fuel"));
                    int avgResp = engine.getAverageResponseTime();
                    
                    String histSummary = String.format(Locale.US,
                        "%s|%d|%d|%d|%d|%.1f|%.1f|%.1f|%.1f|%d|%d|%d",
                        simDisaster.getClass().getSimpleName(),
                        simDisaster.getSeverity(),
                        simDisaster.getDurationHours(),
                        simZonesCount,
                        simPop,
                        waterCov,
                        foodCov,
                        medCov,
                        fuelCov,
                        simTeams,
                        simTimestamp,
                        avgResp
                    );
                    store.appendRunHistory(engine.getRunId(), "COMPLETED", histSummary);
                    store.saveSimulationResult(engine.getRunId(), resObj);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });

            currentEngine.startAsync();
            send(x, 202, "{\"runId\":" + Json.quote(runId) + ",\"status\":\"RUNNING\",\"state\":\"RUNNING\"}");
        }

        private void handleClearHistory(HttpExchange x) throws IOException {
            if (isSimulationRunning()) {
                send(x, 409, "{\"error\":\"Cannot clear history while simulation is running\"}");
                return;
            }
            store.clearHistory();
            send(x, 200, "{\"status\":\"OK\",\"message\":\"History cleared\"}");
        }

        private void handleGetHistory(HttpExchange x) throws IOException {
            List<String> rawHistory = store.loadHistory();
            List<String> itemsJson = new ArrayList<>();
            SimpleDateFormat sdf = new SimpleDateFormat("d MMM yyyy, HH:mm", Locale.US);

            for (String raw : rawHistory) {
                if (raw.isBlank() || raw.startsWith("#")) continue;
                String[] parts = raw.split("\\|");
                if (parts.length == 0) continue;

                String rId = parts[0].trim();
                long ts = parseTimestamp(rId);
                String status = parts.length > 1 ? parts[1].trim() : "COMPLETED";
                String disaster = "Flood";
                int severity = 5;
                int duration = 24;
                int zonesCount = 5;
                long population = 50000;
                double waterCov = 66.7;
                double foodCov = 100.0;
                double medCov = 81.2;
                double fuelCov = 87.0;
                int teams = 10;
                int avgResp = 32;

                if (parts.length >= 14) {
                    // Full format: runId|status|disaster|severity|duration|zones|population|waterCov|foodCov|medCov|fuelCov|teams|timestamp|avgResponse
                    disaster = parts[2].trim();
                    severity = Integer.parseInt(parts[3].trim());
                    duration = Integer.parseInt(parts[4].trim());
                    zonesCount = Integer.parseInt(parts[5].trim());
                    population = Long.parseLong(parts[6].trim());
                    waterCov = Double.parseDouble(parts[7].trim());
                    foodCov = Double.parseDouble(parts[8].trim());
                    medCov = Double.parseDouble(parts[9].trim());
                    fuelCov = Double.parseDouble(parts[10].trim());
                    teams = Integer.parseInt(parts[11].trim());
                    ts = Long.parseLong(parts[12].trim());
                    avgResp = Integer.parseInt(parts[13].trim());
                } else if (parts.length >= 12 && !parts[2].startsWith("teams=")) {
                    // runId|status|disaster|severity|duration|zones|population|waterCov|foodCov|medCov|fuelCov|teams...
                    disaster = parts[2].trim();
                    severity = Integer.parseInt(parts[3].trim());
                    duration = Integer.parseInt(parts[4].trim());
                    zonesCount = Integer.parseInt(parts[5].trim());
                    population = Long.parseLong(parts[6].trim());
                    waterCov = Double.parseDouble(parts[7].trim());
                    foodCov = Double.parseDouble(parts[8].trim());
                    medCov = Double.parseDouble(parts[9].trim());
                    fuelCov = Double.parseDouble(parts[10].trim());
                    teams = Integer.parseInt(parts[11].trim());
                    if (parts.length >= 13) ts = Long.parseLong(parts[12].trim());
                    if (parts.length >= 14) avgResp = Integer.parseInt(parts[13].trim());
                } else if (parts.length >= 3) {
                    // Older format: runId|status|teams=10
                    String summary = parts[2].trim();
                    if (summary.startsWith("teams=")) {
                        try { teams = Integer.parseInt(summary.substring(6)); } catch (Exception ignored) {}
                    }
                }

                double overallCoverage = Math.round(((waterCov + foodCov + medCov + fuelCov) / 4.0) * 10.0) / 10.0;
                String dateStr = sdf.format(new Date(ts));

                StringBuilder item = new StringBuilder();
                item.append("{");
                item.append("\"runId\":").append(Json.quote(rId)).append(",");
                item.append("\"timestamp\":").append(ts).append(",");
                item.append("\"date\":").append(Json.quote(dateStr)).append(",");
                item.append("\"status\":").append(Json.quote(status)).append(",");
                item.append("\"disaster\":").append(Json.quote(disaster)).append(",");
                item.append("\"severity\":").append(severity).append(",");
                item.append("\"duration\":").append(duration).append(",");
                item.append("\"zones\":").append(zonesCount).append(",");
                item.append("\"zonesCount\":").append(zonesCount).append(",");
                item.append("\"population\":").append(population).append(",");
                item.append("\"waterCoverage\":").append(waterCov).append(",");
                item.append("\"foodCoverage\":").append(foodCov).append(",");
                item.append("\"medicineCoverage\":").append(medCov).append(",");
                item.append("\"fuelCoverage\":").append(fuelCov).append(",");
                item.append("\"teams\":").append(teams).append(",");
                item.append("\"avgResponse\":").append(avgResp).append(",");
                item.append("\"overallCoverage\":").append(overallCoverage);
                item.append("}");
                itemsJson.add(item.toString());
            }

            // Reverse order so newest runs are first
            Collections.reverse(itemsJson);

            StringJoiner sj = new StringJoiner(",", "[", "]");
            for (String it : itemsJson) sj.add(it);
            send(x, 200, sj.toString());
        }
    }

    private double getCoveragePct(long[] r) {
        if (r == null || r[0] <= 0) return 100.0;
        double pct = ((double) r[2] / r[0]) * 100.0;
        return Math.round(Math.min(100.0, pct) * 10.0) / 10.0;
    }

    private long parseTimestamp(String runId) {
        if (runId != null && runId.startsWith("RUN-")) {
            try {
                return Long.parseLong(runId.substring(4));
            } catch (Exception ignored) {}
        }
        return System.currentTimeMillis();
    }

    private Map<String, String> form(HttpExchange x) throws IOException {
        Map<String, String> m = new HashMap<>();
        String body = new String(x.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        for (String pair : body.split("&")) {
            if (pair.isBlank()) continue;
            String[] p = pair.split("=", 2);
            m.put(URLDecoder.decode(p[0], StandardCharsets.UTF_8), p.length > 1 ? URLDecoder.decode(p[1], StandardCharsets.UTF_8) : "");
        }
        return m;
    }

    private String resultJson(SimulationEngine engine) {
        SimulationResult result = engine.getFinalResult();
        Disaster d = engine.getDisaster();
        List<Zone> zs = engine.getZones();
        long totalPop = zs.stream().mapToLong(Zone::getPopulation).sum();

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"runId\":").append(Json.quote(engine.getRunId())).append(",");
        sb.append("\"timestamp\":").append(parseTimestamp(engine.getRunId())).append(",");
        sb.append("\"status\":\"COMPLETED\",");
        sb.append("\"disaster\":").append(Json.quote(d.getClass().getSimpleName())).append(",");
        sb.append("\"severity\":").append(d.getSeverity()).append(",");
        sb.append("\"duration\":").append(d.getDurationHours()).append(",");
        sb.append("\"population\":").append(totalPop).append(",");
        sb.append("\"avgResponse\":").append(engine.getAverageResponseTime()).append(",");
        sb.append("\"avgWait\":").append(engine.getAverageWaitTime()).append(",");
        sb.append("\"resources\":").append(Json.resourceMap(result.resources)).append(",");
        sb.append("\"teams\":{");
        sb.append("\"required\":").append(result.teamsRequired).append(",");
        sb.append("\"available\":").append(result.teamsAvailable).append(",");
        sb.append("\"peakAllocated\":").append(result.teamsAvailable).append(",");
        sb.append("\"shortage\":").append(Math.max(0, result.teamsRequired - result.teamsAvailable));
        sb.append("},");
        sb.append("\"zones\":").append(zonesArrayJson(zs, true));
        sb.append("}");
        return sb.toString();
    }

    private String zonesArrayJson(List<Zone> zones, boolean includeRunDetails) {
        StringJoiner j = new StringJoiner(",", "[", "]");
        for (Zone z : zones) {
            j.add(zoneJson(z, includeRunDetails));
        }
        return j.toString();
    }

    private String zoneJson(Zone z, boolean includeRunDetails) {
        long score = z.getPriorityScore();
        String level = z.getPriorityLevel();

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":").append(Json.quote(z.getId())).append(",");
        sb.append("\"name\":").append(Json.quote(z.getName())).append(",");
        sb.append("\"population\":").append(z.getPopulation()).append(",");
        sb.append("\"severity\":").append(z.getSeverity()).append(",");
        sb.append("\"medicalNeed\":").append(z.getMedicalNeed()).append(",");
        sb.append("\"distanceKm\":").append(z.getDistanceKm()).append(",");
        sb.append("\"priorityScore\":").append(score).append(",");
        sb.append("\"priority\":").append(score).append(",");
        sb.append("\"level\":").append(Json.quote(level)).append(",");
        sb.append("\"priorityLevel\":").append(Json.quote(level)).append(",");
        sb.append("\"teamsRequired\":").append(z.getTeamsRequired()).append(",");
        sb.append("\"teamsAssigned\":").append(z.getTeamsAssigned()).append(",");
        sb.append("\"travelMinutes\":").append(z.getTravelMinutes()).append(",");
        sb.append("\"waitMinutes\":").append(z.getWaitMinutes()).append(",");
        sb.append("\"responseMinutes\":").append(z.getResponseMinutes());

        if (includeRunDetails) {
            sb.append(",\"waterDemand\":").append(z.getWaterRequired());
            sb.append(",\"waterAllocated\":").append(z.getWaterAllocated());
            sb.append(",\"waterShortage\":").append(Math.max(0, z.getWaterRequired() - z.getWaterAllocated()));
            sb.append(",\"foodDemand\":").append(z.getFoodRequired());
            sb.append(",\"foodAllocated\":").append(z.getFoodAllocated());
            sb.append(",\"foodShortage\":").append(Math.max(0, z.getFoodRequired() - z.getFoodAllocated()));
            sb.append(",\"medicineDemand\":").append(z.getMedicineRequired());
            sb.append(",\"medicineAllocated\":").append(z.getMedicineAllocated());
            sb.append(",\"medicineShortage\":").append(Math.max(0, z.getMedicineRequired() - z.getMedicineAllocated()));
            sb.append(",\"fuelDemand\":").append(z.getFuelRequired());
            sb.append(",\"fuelAllocated\":").append(z.getFuelAllocated());
            sb.append(",\"fuelShortage\":").append(Math.max(0, z.getFuelRequired() - z.getFuelAllocated()));
        }
        sb.append("}");
        return sb.toString();
    }

    private void send(HttpExchange x, int code, String body) throws IOException {
        x.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        x.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        x.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
        x.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        x.sendResponseHeaders(code, code == 204 ? -1 : b.length);
        if (code != 204) {
            try (OutputStream o = x.getResponseBody()) { o.write(b); }
        }
    }

    public static void main(String[] args) throws Exception {
        new ApiServer(8080).start();
    }
}

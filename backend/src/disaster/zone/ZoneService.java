package disaster.zone;

import disaster.interfaces.DataStore;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ZoneService {
    private final DataStore store;

    public ZoneService(DataStore store) {
        this.store = store;
    }

    public List<Zone> getAllZones() throws IOException {
        return store.loadZones();
    }

    public List<Zone> addZone(String name, long population, int severity, int medicalNeed, int distanceKm, boolean isSimulationRunning) throws IOException {
        if (isSimulationRunning) {
            throw new IllegalStateException("Cannot add zone while simulation is running");
        }
        List<Zone> zones = store.loadZones();
        
        int maxId = 0;
        for (Zone z : zones) {
            try {
                int idNum = Integer.parseInt(z.getId());
                if (idNum > maxId) maxId = idNum;
            } catch (NumberFormatException ignored) {}
        }
        String newId = String.valueOf(maxId + 1);

        for (Zone z : zones) {
            if (z.getId().equals(newId)) {
                throw new IllegalArgumentException("Duplicate zone ID: " + newId);
            }
            if (z.getName().equalsIgnoreCase(name != null ? name.trim() : "")) {
                throw new IllegalArgumentException("A zone with name '" + name + "' already exists");
            }
        }

        Zone newZone = new Zone(newId, name, population, severity, medicalNeed, distanceKm);
        zones.add(newZone);
        store.saveZones(zones);
        return zones;
    }

    public List<Zone> updateZone(String id, String name, long population, int severity, int medicalNeed, int distanceKm, boolean isSimulationRunning) throws IOException {
        if (isSimulationRunning) {
            throw new IllegalStateException("Cannot update zone while simulation is running");
        }
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Zone ID cannot be empty");
        }
        List<Zone> zones = store.loadZones();
        int targetIdx = -1;
        for (int i = 0; i < zones.size(); i++) {
            if (zones.get(i).getId().equals(id.trim())) {
                targetIdx = i;
                break;
            }
        }
        if (targetIdx == -1) {
            throw new IllegalArgumentException("Zone not found with ID: " + id);
        }

        for (int i = 0; i < zones.size(); i++) {
            if (i != targetIdx && zones.get(i).getName().equalsIgnoreCase(name != null ? name.trim() : "")) {
                throw new IllegalArgumentException("A zone with name '" + name + "' already exists");
            }
        }

        Zone updatedZone = new Zone(id.trim(), name, population, severity, medicalNeed, distanceKm);
        zones.set(targetIdx, updatedZone);
        store.saveZones(zones);
        return zones;
    }

    public List<Zone> deleteZone(String id, boolean isSimulationRunning) throws IOException {
        if (isSimulationRunning) {
            throw new IllegalStateException("Cannot delete zone while simulation is running");
        }
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Zone ID cannot be empty");
        }
        List<Zone> zones = store.loadZones();
        boolean removed = zones.removeIf(z -> z.getId().equals(id.trim()));
        if (!removed) {
            throw new IllegalArgumentException("Zone not found with ID: " + id);
        }
        store.saveZones(zones);
        return zones;
    }

    public List<Zone> resetToGoldenZones(boolean isSimulationRunning) throws IOException {
        if (isSimulationRunning) {
            throw new IllegalStateException("Cannot reset zones while simulation is running");
        }
        List<Zone> goldenZones = new ArrayList<>();
        goldenZones.add(new Zone("1", "Zone A", 12000, 5, 5, 8));
        goldenZones.add(new Zone("2", "Zone B", 10000, 4, 3, 15));
        goldenZones.add(new Zone("3", "Zone C", 8000, 3, 3, 22));
        goldenZones.add(new Zone("4", "Zone D", 11000, 2, 2, 30));
        goldenZones.add(new Zone("5", "Zone E", 9000, 1, 2, 40));
        store.saveZones(goldenZones);
        return goldenZones;
    }
}

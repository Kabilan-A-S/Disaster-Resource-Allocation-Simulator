package disaster.file;

import java.io.IOException;
import java.util.*;
import disaster.interfaces.DataStore;
import disaster.disaster.Disaster;
import disaster.zone.Zone;
import disaster.resource.Resource;
import disaster.simulation.SimulationResult;

public class FakeDataStore implements DataStore {
    public final Disaster disaster;
    public final List<Zone> zones = new ArrayList<>();
    public final Map<String, Resource> resources;
    public final List<String> history = new ArrayList<>();
    public SimulationResult saved;

    public FakeDataStore(Disaster d, List<Zone> z, Map<String, Resource> r) {
        this.disaster = d;
        if (z != null) this.zones.addAll(z);
        this.resources = r != null ? r : new HashMap<>();
    }

    @Override
    public Disaster loadDisaster() {
        return disaster;
    }

    @Override
    public List<Zone> loadZones() {
        return new ArrayList<>(zones);
    }

    @Override
    public void saveZones(List<Zone> z) {
        this.zones.clear();
        if (z != null) this.zones.addAll(z);
    }

    @Override
    public Map<String, Resource> loadResources() {
        return resources;
    }

    @Override
    public void saveSimulationResult(String id, SimulationResult r) {
        saved = r;
    }

    @Override
    public void appendRunHistory(String id, String s, String summary) {
        history.add(id + "|" + s + "|" + summary);
    }

    @Override
    public List<String> loadHistory() {
        return new ArrayList<>(history);
    }

    @Override
    public void clearHistory() {
        history.clear();
    }

    @Override
    public java.io.File getZonesFile() {
        return new java.io.File("fake/zones.txt");
    }
}

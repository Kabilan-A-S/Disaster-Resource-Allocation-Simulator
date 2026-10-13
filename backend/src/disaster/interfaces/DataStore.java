package disaster.interfaces;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import disaster.disaster.Disaster;
import disaster.zone.Zone;
import disaster.resource.Resource;
import disaster.simulation.SimulationResult;

public interface DataStore {
    Disaster loadDisaster() throws IOException;
    List<Zone> loadZones() throws IOException;
    void saveZones(List<Zone> zones) throws IOException;
    Map<String, Resource> loadResources() throws IOException;
    void saveSimulationResult(String runId, SimulationResult result) throws IOException;
    void appendRunHistory(String runId, String status, String summary) throws IOException;
    List<String> loadHistory() throws IOException;
    void clearHistory() throws IOException;
    File getZonesFile() throws FileNotFoundException;
}

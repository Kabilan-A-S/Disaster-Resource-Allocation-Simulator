package disaster.simulation;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import disaster.allocation.AllocationRecord;

public class SimulationResult {
    public final List<AllocationRecord> waterAllocation;
    public final int teamsRequired;
    public final int teamsAvailable;
    public final int peakTeams;
    public final Map<String, long[]> resources; // {req, avail, alloc, shortage}

    public SimulationResult(List<AllocationRecord> waterAllocation, int teamsRequired, int teamsAvailable) {
        this.waterAllocation = waterAllocation;
        this.teamsRequired = teamsRequired;
        this.teamsAvailable = teamsAvailable;
        this.peakTeams = teamsAvailable;
        this.resources = new HashMap<>();
    }
}

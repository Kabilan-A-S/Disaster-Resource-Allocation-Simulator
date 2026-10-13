package disaster.allocation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import disaster.resource.Resource;
import disaster.zone.Zone;

public class ResourceAllocator {

    public List<AllocationRecord> allocateBestEffort(Resource resource, List<Zone> zones, int hours, int demandPercent) {
        List<AllocationRecord> results = new ArrayList<>();
        
        // Sort zones strictly by priority score (descending), then ID (ascending) for tie-breaking
        List<Zone> sortedZones = new ArrayList<>(zones);
        Collections.sort(sortedZones);
        
        String resName = resource.getName();

        for (Zone zone : sortedZones) {
            long required = calculateRequired(resName, zone, hours, demandPercent);
            long allocated = 0;
            
            if (required > 0) {
                allocated = resource.drain(required);
            }
            
            zone.setResource(resName, required, allocated);
            results.add(new AllocationRecord(zone.getId(), resName, required, allocated));
        }
        
        return results;
    }

    private long calculateRequired(String resourceName, Zone zone, int hours, int demandPercent) {
        long pop = zone.getPopulation();
        switch (resourceName) {
            case "Water":
                return pop * 3L * hours * demandPercent / 2400L;
            case "Food":
                return pop * 2L * hours * demandPercent / 2400L;
            case "Medicine":
                return pop * zone.getMedicalNeed() * demandPercent / 10000L;
            case "Fuel":
                return zone.getDistanceKm() * 10L;
            default:
                return 0;
        }
    }
}

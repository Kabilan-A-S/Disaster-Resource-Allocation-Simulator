package disaster.rescue;

import disaster.zone.Zone;
import disaster.util.Constants;

public class RescueTask implements Runnable {
    private final TeamPool pool;
    private final Zone zone;
    private final int totalTeamsPool;

    public RescueTask(TeamPool pool, Zone zone) {
        this.pool = pool;
        this.zone = zone;
        this.totalTeamsPool = pool.getTotalTeams();
    }

    @Override
    public void run() {
        int teamsNeeded = zone.getTeamsRequired();
        int actualAssigned = Math.min(teamsNeeded, totalTeamsPool);
        
        long startTime = System.currentTimeMillis();
        
        try {
            pool.acquire(actualAssigned);
            zone.setTeamsAssigned(actualAssigned);
            
            long waitTimeMs = System.currentTimeMillis() - startTime;
            // Convert simulated wait time to minutes
            zone.setWaitMinutes((int) (waitTimeMs / Constants.MS_PER_SIM_MINUTE));
            
            // Travel + Rescue operation
            int travelMs = zone.getTravelMinutes() * Constants.MS_PER_SIM_MINUTE;
            Thread.sleep(travelMs);
            
            zone.setResponseMinutes(zone.getWaitMinutes() + zone.getTravelMinutes());
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            pool.release(actualAssigned);
        }
    }
}

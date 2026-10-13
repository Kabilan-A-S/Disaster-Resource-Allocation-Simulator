package disaster.rescue;

public class TeamPool {
    private int availableTeams;
    private final int totalTeams;

    public TeamPool(int initialTeams) {
        if (initialTeams < 0) throw new IllegalArgumentException("Teams cannot be negative");
        this.availableTeams = initialTeams;
        this.totalTeams = initialTeams;
    }

    public synchronized void acquire(int requiredTeams) throws InterruptedException {
        int cappedRequest = Math.min(requiredTeams, totalTeams);
        while (availableTeams < cappedRequest) {
            wait();
        }
        availableTeams -= cappedRequest;
    }

    public synchronized int acquire(String zoneId, int requiredTeams) throws InterruptedException {
        int cappedRequest = Math.min(requiredTeams, totalTeams);
        while (availableTeams < cappedRequest) {
            wait();
        }
        availableTeams -= cappedRequest;
        return cappedRequest;
    }

    public synchronized void release(int returnedTeams) {
        availableTeams += returnedTeams;
        notifyAll();
    }

    public synchronized int getAvailableTeams() {
        return availableTeams;
    }

    public synchronized int getAvailable() {
        return availableTeams;
    }
    
    public int getTotalTeams() {
        return totalTeams;
    }
}

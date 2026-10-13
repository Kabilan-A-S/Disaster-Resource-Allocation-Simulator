package disaster.zone;

import disaster.util.Constants;

public class Zone implements Comparable<Zone> {
    private final String id;
    private final String name;
    private final long population;
    private final int severity;
    private final int medicalNeed;
    private final int distanceKm;

    // Computed attributes
    private final long priorityScore;
    private final String priorityLevel;
    
    // Resource tracking
    private long waterRequired;
    private long waterAllocated;
    private long foodRequired;
    private long foodAllocated;
    private long medicineRequired;
    private long medicineAllocated;
    private long fuelRequired;
    private long fuelAllocated;

    // Team tracking
    private int teamsRequired;
    private int teamsAssigned;
    private int travelMinutes;
    private int responseMinutes;
    private int waitMinutes;

    public Zone(String id, String name, long population, int severity, int medicalNeed, int distanceKm) {
        if (id == null || id.trim().isEmpty()) {
            throw new IllegalArgumentException("Zone ID cannot be empty");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Zone name cannot be empty");
        }
        if (population <= 0) {
            throw new IllegalArgumentException("Population must be greater than 0");
        }
        if (severity < 1 || severity > 5) {
            throw new IllegalArgumentException("Severity must be between 1 and 5");
        }
        if (medicalNeed < 1 || medicalNeed > 5) {
            throw new IllegalArgumentException("Medical need must be between 1 and 5");
        }
        if (distanceKm <= 0) {
            throw new IllegalArgumentException("Distance must be greater than 0");
        }

        this.id = id.trim();
        this.name = name.trim();
        this.population = population;
        this.severity = severity;
        this.medicalNeed = medicalNeed;
        this.distanceKm = distanceKm;
        this.priorityScore = this.population * this.severity * this.medicalNeed;
        
        if (this.priorityScore >= Constants.PRIORITY_CRITICAL) this.priorityLevel = "CRITICAL";
        else if (this.priorityScore >= Constants.PRIORITY_HIGH) this.priorityLevel = "HIGH";
        else if (this.priorityScore >= Constants.PRIORITY_MEDIUM) this.priorityLevel = "MEDIUM";
        else this.priorityLevel = "LOW";

        this.teamsRequired = (int) ((this.population + (Constants.PEOPLE_PER_TEAM - 1)) / Constants.PEOPLE_PER_TEAM);
        this.travelMinutes = this.distanceKm * 60 / Constants.VEHICLE_SPEED_KMPH;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public long getPopulation() { return population; }
    public int getSeverity() { return severity; }
    public int getMedicalNeed() { return medicalNeed; }
    public int getDistanceKm() { return distanceKm; }
    public long getPriorityScore() { return priorityScore; }
    public String getPriorityLevel() { return priorityLevel; }
    public long calculatePriority() { return priorityScore; }
    
    public int getTeamsRequired() { return teamsRequired; }
    public int getTeamsAssigned() { return teamsAssigned; }
    public void setTeamsAssigned(int teamsAssigned) { this.teamsAssigned = teamsAssigned; }
    
    public int getTravelMinutes() { return travelMinutes; }
    public int getResponseMinutes() { return responseMinutes; }
    public void setResponseMinutes(int responseMinutes) { this.responseMinutes = responseMinutes; }
    
    public int getWaitMinutes() { return waitMinutes; }
    public void setWaitMinutes(int waitMinutes) { this.waitMinutes = waitMinutes; }

    public long getWaterRequired() { return waterRequired; }
    public long getWaterAllocated() { return waterAllocated; }
    public long getFoodRequired() { return foodRequired; }
    public long getFoodAllocated() { return foodAllocated; }
    public long getMedicineRequired() { return medicineRequired; }
    public long getMedicineAllocated() { return medicineAllocated; }
    public long getFuelRequired() { return fuelRequired; }
    public long getFuelAllocated() { return fuelAllocated; }

    public void setResource(String resourceName, long required, long allocated) {
        switch (resourceName) {
            case "Water": this.waterRequired = required; this.waterAllocated = allocated; break;
            case "Food": this.foodRequired = required; this.foodAllocated = allocated; break;
            case "Medicine": this.medicineRequired = required; this.medicineAllocated = allocated; break;
            case "Fuel": this.fuelRequired = required; this.fuelAllocated = allocated; break;
        }
    }

    @Override
    public int compareTo(Zone other) {
        int scoreCompare = Long.compare(other.priorityScore, this.priorityScore);
        if (scoreCompare != 0) return scoreCompare;
        return this.id.compareTo(other.id);
    }
}

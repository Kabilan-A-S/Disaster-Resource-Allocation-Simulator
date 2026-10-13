package disaster.disaster;

public abstract class Disaster {
    protected int severity;
    protected int durationHours;
    protected long populationAffected;
    
    public Disaster(int severity, int durationHours, long populationAffected) {
        if (severity < 1 || severity > 5) {
            throw new IllegalArgumentException("Severity must be between 1 and 5");
        }
        if (durationHours <= 0 || durationHours % 6 != 0) {
            throw new IllegalArgumentException("Duration must be a multiple of 6 between 6 and 72");
        }
        if (populationAffected <= 0) {
            throw new IllegalArgumentException("Population must be greater than 0");
        }
        this.severity = severity;
        this.durationHours = durationHours;
        this.populationAffected = populationAffected;
    }
    
    public abstract int getBaseFactor();
    public abstract int getTypeBonus();
    
    public int calculateImpact() {
        int baseImpact = getBaseFactor() * severity * (int)Math.ceil(durationHours / 6.0) / 100;
        return baseImpact + getTypeBonus();
    }

    public int getDemandPercent() {
        return 100 + calculateImpact();
    }

    public int demandPercent() {
        return getDemandPercent();
    }

    public int getSeverity() { return severity; }
    public int getDurationHours() { return durationHours; }
    public long getPopulationAffected() { return populationAffected; }
}

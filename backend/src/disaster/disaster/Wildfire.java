package disaster.disaster;

public class Wildfire extends NaturalDisaster {
    public Wildfire(int severity, int durationHours, long populationAffected) {
        super(severity, durationHours, populationAffected);
    }
    
    @Override
    public int getBaseFactor() { return 110; }
    
    @Override
    public int getTypeBonus() { return 0; }
}

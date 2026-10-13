package disaster.disaster;

public class Flood extends NaturalDisaster {
    public Flood(int severity, int durationHours, long populationAffected) {
        super(severity, durationHours, populationAffected);
    }
    
    @Override
    public int getBaseFactor() { return 100; }
    
    @Override
    public int getTypeBonus() { return 0; }
}

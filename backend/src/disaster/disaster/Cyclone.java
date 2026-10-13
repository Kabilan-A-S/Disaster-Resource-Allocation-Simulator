package disaster.disaster;

public class Cyclone extends NaturalDisaster {
    public Cyclone(int severity, int durationHours, long populationAffected) {
        super(severity, durationHours, populationAffected);
    }
    
    @Override
    public int getBaseFactor() { return 120; }
    
    @Override
    public int getTypeBonus() { return 0; }
}

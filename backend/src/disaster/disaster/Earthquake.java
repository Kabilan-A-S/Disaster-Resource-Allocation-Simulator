package disaster.disaster;

public class Earthquake extends NaturalDisaster {
    public Earthquake(int severity, int durationHours, long populationAffected) {
        super(severity, durationHours, populationAffected);
    }
    
    @Override
    public int getBaseFactor() { return 150; }
    
    @Override
    public int getTypeBonus() { return 0; }
}

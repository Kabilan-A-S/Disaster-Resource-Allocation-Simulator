package disaster.disaster;

public abstract class NaturalDisaster extends Disaster {
    public NaturalDisaster(int severity, int durationHours, long populationAffected) {
        super(severity, durationHours, populationAffected);
    }
}

package disaster.test;

import org.junit.jupiter.api.*;
import disaster.disaster.*;
import static org.junit.jupiter.api.Assertions.*;

class DisasterTest {
    @Test void floodImpact() {
        Disaster d = new Flood(5, 24, 50000);
        assertEquals(20, d.calculateImpact());
        assertEquals(120, d.demandPercent());
    }

    @Test void invalidDuration() {
        assertThrows(RuntimeException.class, () -> new Flood(5, 25, 1));
    }
}

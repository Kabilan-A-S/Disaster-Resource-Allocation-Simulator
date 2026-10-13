package disaster.test;

import org.junit.jupiter.api.*;
import java.util.*;
import disaster.disaster.*;
import disaster.zone.*;
import disaster.resource.*;
import disaster.simulation.*;
import static org.junit.jupiter.api.Assertions.*;

@Tag("golden")
class SimulationEngineTest {
    private SimulationResult result;

    @BeforeEach
    void run() {
        List<Zone> z = List.of(
            new Zone("1", "Zone A", 12000, 5, 5, 8),
            new Zone("2", "Zone B", 10000, 4, 3, 15),
            new Zone("3", "Zone C", 8000, 3, 3, 22),
            new Zone("4", "Zone D", 11000, 2, 2, 30),
            new Zone("5", "Zone E", 9000, 1, 2, 40)
        );
        Map<String, Resource> r = new HashMap<>();
        r.put("Water", new Water(120000));
        r.put("Food", new Food(130000));
        r.put("Medicine", new Medicine(1500));
        r.put("Fuel", new Fuel(1000));
        result = new SimulationEngine(new Flood(5, 24, 50000), z, r, 10).run();
    }

    @Test
    void goldenResources() {
        assertArrayEquals(new long[]{180000, 120000, 120000, 60000}, result.resources.get("Water"));
        assertArrayEquals(new long[]{120000, 130000, 120000, 0}, result.resources.get("Food"));
        assertArrayEquals(new long[]{1848, 1500, 1500, 348}, result.resources.get("Medicine"));
        assertArrayEquals(new long[]{1150, 1000, 1000, 150}, result.resources.get("Fuel"));
    }

    @Test
    void goldenTeams() {
        assertEquals(22, result.teamsRequired);
        assertEquals(10, result.peakTeams);
    }
}

package disaster.test;

import org.junit.jupiter.api.*;
import disaster.file.FakeDataStore;
import disaster.zone.Zone;
import disaster.zone.ZoneService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ZoneServiceTest {
    private FakeDataStore store;
    private ZoneService service;

    @BeforeEach
    void setup() {
        List<Zone> initialZones = new ArrayList<>();
        initialZones.add(new Zone("1", "Zone A", 12000, 5, 5, 8));
        initialZones.add(new Zone("2", "Zone B", 10000, 4, 3, 15));
        store = new FakeDataStore(null, initialZones, new HashMap<>());
        service = new ZoneService(store);
    }

    @Test
    @DisplayName("Successfully add a new zone with auto-incremented ID")
    void testAddZone() throws IOException {
        List<Zone> result = service.addZone("Zone F", 7000, 3, 2, 18, false);
        assertEquals(3, result.size());
        Zone added = result.get(2);
        assertEquals("3", added.getId());
        assertEquals("Zone F", added.getName());
        assertEquals(7000, added.getPopulation());
        assertEquals(42000, added.getPriorityScore());
        assertEquals("MEDIUM", added.getPriorityLevel());
    }

    @Test
    @DisplayName("Validation fails on invalid population or severity")
    void testValidationFails() {
        assertThrows(IllegalArgumentException.class, () -> service.addZone("Zone X", 0, 3, 2, 10, false));
        assertThrows(IllegalArgumentException.class, () -> service.addZone("Zone X", 1000, 6, 2, 10, false));
        assertThrows(IllegalArgumentException.class, () -> service.addZone("Zone X", 1000, 3, 0, 10, false));
        assertThrows(IllegalArgumentException.class, () -> service.addZone("Zone X", 1000, 3, 2, 0, false));
        assertThrows(IllegalArgumentException.class, () -> service.addZone("", 1000, 3, 2, 10, false));
    }

    @Test
    @DisplayName("Cannot add duplicate zone name")
    void testDuplicateName() {
        assertThrows(IllegalArgumentException.class, () -> service.addZone("Zone A", 5000, 2, 2, 10, false));
    }

    @Test
    @DisplayName("Cannot add/update/delete while simulation is running (HTTP 409 conflict)")
    void testSimulationRunningConflict() {
        assertThrows(IllegalStateException.class, () -> service.addZone("Zone F", 7000, 3, 2, 18, true));
        assertThrows(IllegalStateException.class, () -> service.updateZone("1", "Zone A Modified", 15000, 5, 5, 10, true));
        assertThrows(IllegalStateException.class, () -> service.deleteZone("1", true));
        assertThrows(IllegalStateException.class, () -> service.resetToGoldenZones(true));
    }

    @Test
    @DisplayName("Update zone successfully")
    void testUpdateZone() throws IOException {
        List<Zone> result = service.updateZone("1", "Zone A Prime", 14000, 5, 5, 10, false);
        assertEquals(2, result.size());
        Zone updated = result.get(0);
        assertEquals("1", updated.getId());
        assertEquals("Zone A Prime", updated.getName());
        assertEquals(14000, updated.getPopulation());
        assertEquals(350000, updated.getPriorityScore());
        assertEquals("CRITICAL", updated.getPriorityLevel());
    }

    @Test
    @DisplayName("Delete zone successfully")
    void testDeleteZone() throws IOException {
        List<Zone> result = service.deleteZone("1", false);
        assertEquals(1, result.size());
        assertEquals("2", result.get(0).getId());
        assertEquals("Zone B", result.get(0).getName());
    }

    @Test
    @DisplayName("Reset restores the 5 golden zones")
    void testResetZones() throws IOException {
        service.deleteZone("1", false);
        assertEquals(1, service.getAllZones().size());

        List<Zone> golden = service.resetToGoldenZones(false);
        assertEquals(5, golden.size());
        assertEquals("Zone A", golden.get(0).getName());
        assertEquals("Zone E", golden.get(4).getName());
    }
}

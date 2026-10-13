package disaster.test; import org.junit.jupiter.api.*; import disaster.rescue.TeamPool;import static org.junit.jupiter.api.Assertions.*;
class TeamPoolTest{@Test void acquiresAndReleases()throws Exception{TeamPool p=new TeamPool(10);assertEquals(5,p.acquire("A",5));p.release(5);assertEquals(10,p.getAvailable());}}

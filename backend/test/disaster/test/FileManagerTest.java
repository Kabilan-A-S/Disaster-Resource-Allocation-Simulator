package disaster.test; import org.junit.jupiter.api.*;import disaster.file.FileManager;import static org.junit.jupiter.api.Assertions.*;
class FileManagerTest{@Test void loadsGoldenFiles()throws Exception{FileManager f=new FileManager();assertEquals(5,f.loadZones().size());assertEquals(120000,f.loadResources().get("Water").getQuantity());}}

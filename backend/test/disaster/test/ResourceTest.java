package disaster.test; import org.junit.jupiter.api.*; import disaster.resource.*; import static org.junit.jupiter.api.Assertions.*;
class ResourceTest {@Test void synchronizedRemoval()throws Exception{Water w=new Water(1000);w.removeResource(700);assertEquals(300,w.getQuantity());assertThrows(Exception.class,()->w.removeResource(400));}}

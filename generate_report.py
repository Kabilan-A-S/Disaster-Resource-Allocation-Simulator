from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import sys

def main():
    doc = Document()

    # Helpers
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.bold = True
        run.font.size = Pt(20)
        
    def add_heading(text, level=1):
        doc.add_heading(text, level=level)

    def add_paragraph(text, align='left'):
        p = doc.add_paragraph(text)
        if align == 'center':
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        elif align == 'justify':
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        return p
        
    def add_code(text):
        p = doc.add_paragraph()
        run = p.add_run(text)
        run.font.name = 'Courier New'
        run.font.size = Pt(9)
        
    def add_bold(p, text):
        run = p.add_run(text)
        run.bold = True
        
    def add_text(p, text):
        p.add_run(text)

    # --- COVER PAGE ---
    doc.add_paragraph('\n\n\n')
    add_title("DISASTER RESOURCE ALLOCATION SIMULATOR")
    doc.add_paragraph('\n\n')
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_text(p, "A Project Report\nSubmitted by:\n\n")
    add_bold(p, "Kabilan A S � 3122255001071\n")
    add_bold(p, "Kavinkumar L � 3122255001075\n")
    add_bold(p, "Nitin Karthikeyan � 3122245001705\n\n")
    add_text(p, "SSN College of Engineering\nDepartment of Computer Science and Engineering\nAcademic Year: 2026-2027")
    doc.add_page_break()

    # --- CERTIFICATE ---
    add_heading("CERTIFICATE", level=1)
    doc.add_paragraph("This is to certify that the project report entitled \"DISASTER RESOURCE ALLOCATION SIMULATOR\" is the bona fide work of Kabilan A S, Kavinkumar L, and Nitin Karthikeyan who carried out the project work under my supervision.", style='Body Text')
    doc.add_paragraph('\n\n\n')
    doc.add_paragraph("_________________________\nSignature of Supervisor\n[Placeholder for Faculty Name]")
    doc.add_page_break()
    
    # --- DECLARATION ---
    add_heading("DECLARATION", level=1)
    doc.add_paragraph("We hereby declare that the project entitled \"DISASTER RESOURCE ALLOCATION SIMULATOR\" submitted to SSN College of Engineering is a record of an original work done by us under the guidance of the faculty mentor, and this project work has not formed the basis for the award of any degree or diploma/associate fellowship or similar title to any candidate of any university.")
    doc.add_paragraph("\n\nSignatures:\n1. Kabilan A S\n2. Kavinkumar L\n3. Nitin Karthikeyan")
    doc.add_page_break()

    # --- ACKNOWLEDGEMENT ---
    add_heading("ACKNOWLEDGEMENT", level=1)
    doc.add_paragraph("We would like to express our deep gratitude to our faculty mentors and the Department of Computer Science and Engineering at SSN College of Engineering for their valuable guidance and support during the course of this project.")
    doc.add_page_break()

    # --- ABSTRACT ---
    add_heading("ABSTRACT", level=1)
    doc.add_paragraph("The Disaster Resource Allocation Simulator is an advanced software system designed to model, calculate, and distribute critical resources (Water, Food, Medicine, Fuel, and Rescue Teams) during disaster scenarios. Using a Java-based backend running a custom multithreaded simulation engine and a modern React/Vite frontend, the system processes demographic and geographical data to calculate requirements dynamically. The engine uses priority-based allocation by computing zone criticality (Population � Severity � Medical Need) and demonstrates core Object-Oriented Programming principles and concurrent execution using wait/notify thread synchronization. The system exposes a RESTful API to integrate with the frontend and supports 'what-if' analysis for emergency preparedness.", style='Body Text')
    doc.add_page_break()

    # --- CHAPTER 1 ---
    add_heading("CHAPTER 1 � INTRODUCTION", level=1)
    add_heading("1.1 Background", level=2)
    doc.add_paragraph("Efficient allocation of resources during natural disasters is critical to minimizing casualties and damage. Emergency management centers must rapidly assess the situation, prioritize affected zones, and dispatch resources.")
    add_heading("1.2 Problem Statement", level=2)
    doc.add_paragraph("Manual resource allocation in disaster scenarios is slow and prone to errors. A centralized, automated simulation engine is needed to accurately distribute limited resources across multiple zones based on calculated priority metrics rather than arbitrary distribution.")
    add_heading("1.3 Motivation", level=2)
    doc.add_paragraph("The motivation is to provide an interactive and robust tool to simulate disaster response. By mathematically modeling resource needs and using concurrent programming for rescue team dispatch, we can accurately simulate the chaotic nature of emergencies.")
    add_heading("1.4 Objectives", level=2)
    doc.add_paragraph("- Develop a priority-based resource allocation algorithm.\n- Build a custom multithreaded engine simulating concurrent rescue operations.\n- Create a responsive React frontend for visualization and 'what-if' analysis.")
    add_heading("1.5 Scope", level=2)
    doc.add_paragraph("The system covers natural disasters like Floods, Earthquakes, Cyclones, and Wildfires. It tracks Water, Food, Medicine, Fuel, and Rescue Teams across predefined zones.")
    add_heading("1.6 Significance of the Project", level=2)
    doc.add_paragraph("The project bridges theoretical OOP and OS concepts (multithreading, synchronization) with practical React/Java integration, providing an extensible platform for future predictive analytics.")
    
    # --- CHAPTER 2 ---
    add_heading("CHAPTER 2 � EXISTING AND PROPOSED SYSTEM", level=1)
    add_heading("2.1 Existing System", level=2)
    doc.add_paragraph("Traditional and basic systems rely on manual spreadsheets or simple sequential rule engines without real-time simulation or dynamic priority adjustments.")
    add_heading("2.2 Problems in Existing Approach", level=2)
    doc.add_paragraph("- Lack of concurrent modeling of simultaneous rescue operations.\n- Static allocation that fails to scale dynamically with disaster severity.\n- Absence of visual 'what-if' forecasting.")
    add_heading("2.3 Proposed System", level=2)
    doc.add_paragraph("The proposed simulator dynamically calculates resource needs. It uses a mathematical priority model, handles resource shortages optimally, and employs Java multithreading to simulate independent rescue teams operating simultaneously in different zones.")
    add_heading("2.4 Advantages of Proposed System", level=2)
    doc.add_paragraph("Automated priority calculation, prevention of race conditions via Java synchronization, real-time frontend monitoring via fetch API, and deterministic results storage.")

    # --- CHAPTER 3 ---
    add_heading("CHAPTER 3 � REQUIREMENTS", level=1)
    add_heading("3.1 Functional Requirements", level=2)
    doc.add_paragraph("- Create disaster scenarios\n- Manage affected zones and resources\n- Calculate zone requirements and priority\n- Allocate resources dynamically\n- Run concurrent rescue simulation\n- Monitor simulation status\n- View results and history\n- Perform What-If analysis")
    add_heading("3.2 Non-Functional Requirements", level=2)
    doc.add_paragraph("- Modularity: Strict separation of frontend and backend.\n- Reliability: Thread-safe resource depletion.\n- Responsiveness: Non-blocking HTTP API.")
    add_heading("3.3 Software Requirements", level=2)
    doc.add_paragraph("Backend: Java 17/21, JDK HttpServer, JUnit 5\nFrontend: React, Vite, TypeScript, CSS")

    # --- CHAPTER 4 ---
    add_heading("CHAPTER 4 � SYSTEM ARCHITECTURE", level=1)
    doc.add_paragraph("The architecture employs a decoupled client-server model.")
    
    add_code('''
    +-------------------+       HTTP / FETCH       +---------------------------+
    |   REACT FRONTEND  | -----------------------> | JAVA HTTP SERVER / API    |
    | (Vite, TS, CSS)   | <----------------------- | (disaster.server.ApiServer|
    +-------------------+          JSON            +---------------------------+
                                                                |
                                                                v
                                                   +---------------------------+
                                                   |     SIMULATION ENGINE     |
                                                   | (disaster.simulation)     |
                                                   +---------------------------+
                                                     |        |         |
                                         +-----------+        |         +----------+
                                         v                    v                    v
                             +-------------------+  +-------------------+  +-------------------+
                             | Zone & Disaster   |  | Resource Mgmt &   |  | Team Pool & Rescue|
                             | Calculation Model |  | Allocation Logic  |  | (Multithreading)  |
                             +-------------------+  +-------------------+  +-------------------+
                                                                |
                                                                v
                                                   +---------------------------+
                                                   |    FILE DATA STORE        |
                                                   | (zones.txt, resources.txt)|
                                                   +---------------------------+
    ''')
    doc.add_paragraph("Figure 4.1 - System Architecture Diagram")

    # --- CHAPTER 5 ---
    add_heading("CHAPTER 5 � COMPLETE SYSTEM WORKFLOW", level=1)
    add_code('''
    START
      |
      v
    Open React Application -> Initialize Backend DataStore
      |
      v
    Create / Select Disaster Parameters
      |
      v
    Load Zones and Compute Requirements
      |
      v
    Calculate Zone Priority (Population * Severity * Medical Need)
      |
      v
    Allocate Available Resources (Best Effort via Priority)
      |
      v
    Initialize TeamPool for Rescue
      |
      v
    Start Rescue Operations (Concurrent RescueTasks)
      |
      v
    Thread Wait/Notify for Team Dispatch and Return
      |
      v
    Calculate Wait Time and Response Time per Zone
      |
      v
    Save SimulationResult (DataStore)
      |
      v
    Display Results and Analytics in React UI
      |
      v
    END
    ''')
    doc.add_paragraph("Figure 5.1 - Workflow Chart")

    # --- CHAPTER 6 ---
    add_heading("CHAPTER 6 � SYSTEM DESIGN", level=1)
    add_heading("6.1 Class Diagram Summary", level=2)
    doc.add_paragraph("Key Java classes discovered in the source code:")
    add_code('''
    Disaster (Abstract) <|-- NaturalDisaster <|-- Flood, Earthquake, Cyclone, Wildfire
    Resource (Abstract) <|-- Consumable <|-- Water, Food, Medicine, Fuel
    
    SimulationEngine 
       - Disaster
       - List<Zone>
       - Map<String, Resource>
       - TeamPool
       
    ResourceAllocator
       + allocateBestEffort()
       
    RescueTask (implements Runnable)
       + run() -> performs travel/rescue, calls TeamPool.acquire()/release()
       
    ApiServer & ApiHandler
       + handleStartSimulation()
       + handleWhatIf()
    ''')
    doc.add_paragraph("Figure 6.1 - Simplified Class Diagram Hierarchy")

    # --- CHAPTER 7 ---
    add_heading("CHAPTER 7 � OBJECT ORIENTED PROGRAMMING", level=1)
    add_heading("7.1 Encapsulation", level=2)
    doc.add_paragraph("Data fields in Zone.java (e.g., population, waterRequired) are protected from arbitrary modification using private access modifiers and manipulated via getters and specific setter methods (like setResource).")
    add_heading("7.2 Inheritance & 7.4 Abstraction", level=2)
    doc.add_paragraph("The Disaster and Resource abstract classes define the base contract. Subclasses like Flood and Water inherit properties and implement abstract methods (e.g., getBaseFactor() in Flood).")
    add_heading("7.3 Polymorphism", level=2)
    doc.add_paragraph("Overridden methods in subclasses and polymorphic references are used extensively. For example, Map<String, Resource> stores any resource type, and calling drain() executes the synchronized implementation in the base Resource class while maintaining subclass identity.")
    add_heading("7.6 Interfaces", level=2)
    doc.add_paragraph("The DataStore interface defines the contract for loading/saving data. FileManager implements this to provide text-file based storage, while FakeDataStore provides mock data for testing.")
    add_heading("7.8 Collections & 7.9 Generics", level=2)
    doc.add_paragraph("Extensive use of List<Zone>, Map<String, Resource>, and Collections.sort() utilizing the generic Comparable<Zone> interface for priority-based sorting.")
    add_heading("7.11 Exception Handling", level=2)
    doc.add_paragraph("Custom exceptions such as InsufficientResourceException (which extends DisasterException) are thrown when resource drainage exceeds available limits.")

    # --- CHAPTER 8 ---
    add_heading("CHAPTER 8 � DISASTER AND ZONE MODEL", level=1)
    doc.add_paragraph("The priority formula is implemented in Zone.java as:")
    add_code("priorityScore = population * severity * medicalNeed;")
    doc.add_paragraph("Zones are sorted strictly descending by this score. Based on the score, zones receive qualitative levels (CRITICAL >= 100000, HIGH >= 50000, MEDIUM >= 20000).")
    doc.add_paragraph("The demand percentage scales with the disaster duration and type:")
    add_code("baseImpact = getBaseFactor() * severity * ceil(durationHours / 6.0) / 100;")
    add_code("demandPercent = 100 + baseImpact + getTypeBonus();")

    # --- CHAPTER 9 ---
    add_heading("CHAPTER 9 � RESOURCE MANAGEMENT AND ALLOCATION", level=1)
    doc.add_paragraph("ResourceAllocator calculates requirements using specific formulas based on demandPercent and predefined Constants:")
    add_code('''
    Water: population * 3 * durationHours * demandPercent / 2400
    Food: population * 2 * durationHours * demandPercent / 2400
    Medicine: population * medicalNeed * demandPercent / 10000
    Fuel: distanceKm * 10
    Teams: ceil(population / 2500)
    ''')
    doc.add_paragraph("Allocation is 'best effort'. Resources are drained sequentially based on sorted zone priority.")

    # --- CHAPTER 10 ---
    add_heading("CHAPTER 10 � SIMULATION ENGINE", level=1)
    doc.add_paragraph("The SimulationEngine encapsulates the entire runtime state. It runs asynchronously, initialized via /api/simulation/start. It tracks stages (CONFIGURED, RUNNING, COMPLETED), handles resource allocation, and triggers parallel RescueTask threads.")

    # --- CHAPTER 11 ---
    add_heading("CHAPTER 11 � MULTITHREADING AND SYNCHRONIZATION", level=1)
    doc.add_paragraph("The system simulates rescue operations concurrently. RescueTask implements Runnable and is spawned for each zone. ")
    doc.add_paragraph("The TeamPool acts as a shared resource broker with strict thread synchronization to prevent race conditions (as demonstrated in RaceConditionDemo.java).")
    add_code('''
    public synchronized void acquire(int requiredTeams) throws InterruptedException {
        int cappedRequest = Math.min(requiredTeams, totalTeams);
        while (availableTeams < cappedRequest) {
            wait();
        }
        availableTeams -= cappedRequest;
    }
    ''')
    doc.add_paragraph("When a team completes a task, it calls 
elease() which invokes 
otifyAll() to wake up pending RescueTask threads. Thread states transition from NEW -> RUNNABLE -> WAITING/TIMED_WAITING (via sleep) -> TERMINATED, as proved by ThreadDemo.java.")

    # --- CHAPTER 12 ---
    add_heading("CHAPTER 12 � FILE HANDLING AND DATA PERSISTENCE", level=1)
    doc.add_paragraph("The FileManager class handles text-based persistence. It parses flat text files (zones.txt, 
esources.txt, disasters.txt) separated by pipe (|) characters. Results are serialized into simulation_results.txt and 
un_history.txt using the custom Json utility class.")

    # --- CHAPTER 13 ---
    add_heading("CHAPTER 13 � HTTP API / BACKEND", level=1)
    doc.add_paragraph("The backend utilizes the native JDK HttpServer. Endpoints include:")
    add_code('''
    | Method | Endpoint                  | Purpose                            |
    |--------|---------------------------|------------------------------------|
    | POST   | /api/simulation/start     | Initializes and starts a run       |
    | GET    | /api/simulation/status    | Polls simulation progress          |
    | GET    | /api/simulation/results   | Retrieves final calculation        |
    | GET    | /api/zones                | Lists base zones                   |
    | GET    | /api/resources            | Lists available resources          |
    | POST   | /api/simulation/what-if   | Runs isolated calculation          |
    | GET    | /api/history              | Retrieves past simulation runs     |
    ''')

    # --- CHAPTER 14 ---
    add_heading("CHAPTER 14 � REACT FRONTEND", level=1)
    doc.add_paragraph("The UI is built with React and Vite. It contains modular components such as EmergencyCommandCenter, DisasterConfiguration, ResourceAllocation, AffectedZones, SimulationControl, and WhatIfAnalysis.")
    doc.add_paragraph("[Insert Screenshot of Dashboard Here]")
    doc.add_paragraph("Figure 14.1 - Emergency Command Center Dashboard. Provides global overview.")
    doc.add_paragraph("[Insert Screenshot of Resource Allocation Here]")
    doc.add_paragraph("Figure 14.2 - Resource Allocation View. Shows shortages and assigned values.")

    # --- CHAPTER 15 ---
    add_heading("CHAPTER 15 � FRONTEND / BACKEND INTEGRATION", level=1)
    doc.add_paragraph("The frontend communicates with the Java backend via the native etch API (simulationApi.ts). The SimulationContext provider manages global state, polling the /api/simulation/status endpoint to update the UI without page reloads.")

    # --- CHAPTER 16 ---
    add_heading("CHAPTER 16 � TESTING", level=1)
    doc.add_paragraph("The project uses JUnit 5. Actual test suite execution results:")
    add_code('''
    | Test ID | Test Case                 | Status |
    |---------|---------------------------|--------|
    | 1       | synchronizedRemoval       | PASS   |
    | 2       | loadsGoldenFiles          | PASS   |
    | 3       | goldenTeams               | FAIL   |
    | 4       | goldenResources           | FAIL   |
    | 5       | Zone A priority           | FAIL   |
    | 6       | invalidPopulation         | FAIL   |
    | 7       | floodImpact               | FAIL   |
    | 8       | invalidDuration           | FAIL   |
    | 9       | acquiresAndReleases       | FAIL   |
    ''')
    doc.add_paragraph("The system exhibits signature mismatch issues in Flood constructor and missing calculatePriority methods in the test implementations, indicating code evolution out of sync with tests.")

    # --- CHAPTER 17 ---
    add_heading("CHAPTER 17 � GOLDEN SCENARIO", level=1)
    doc.add_paragraph("Verified against the actual logic for Flood, Severity 5, Duration 24h, Population 50,000 (Zones A, B, C, D, E):")
    add_code('''
    Water Required: 180,000 | Available: 120,000 | Shortage: 60,000
    Food Required: 120,000 | Available: 130,000 | Shortage: 0
    Medicine Required: 1,848 | Available: 1,500 | Shortage: 348
    Fuel Required: 1,150 | Available: 1,000 | Shortage: 150
    Teams Required: 22 | Available: 10 | Shortage: 12
    ''')

    # --- CHAPTER 18 ---
    add_heading("CHAPTER 18 � RESULTS AND DISCUSSION", level=1)
    doc.add_paragraph("The algorithm successfully prioritizes Zone A (Score: 300,000). Resources are dynamically constrained, and team pooling correctly forces low-priority zones to 'Wait' while teams execute rescues in higher-priority zones.")

    # --- CHAPTER 19 ---
    add_heading("CHAPTER 19 � WHAT-IF ANALYSIS", level=1)
    doc.add_paragraph("The /api/simulation/what-if endpoint allows users to inject temporary parameters (e.g., doubling severity) to observe mathematical impact without mutating the permanent DataStore.")

    # --- CHAPTER 20 ---
    add_heading("CHAPTER 20 � LIMITATIONS", level=1)
    doc.add_paragraph("- Relies on flat text-file persistence instead of a relational database.\n- Lack of real-world GIS/GPS integration.\n- Allocation is linear and rule-based rather than utilizing advanced optimization algorithms.")

    # --- CHAPTER 21 ---
    add_heading("CHAPTER 21 � FUTURE ENHANCEMENTS", level=1)
    doc.add_paragraph("- FUTURE WORK: Database Integration (e.g., PostgreSQL).\n- FUTURE WORK: Cloud deployment via Docker/AWS.\n- FUTURE WORK: Map integrations using Leaflet/Google Maps API.")

    # --- CHAPTER 22 ---
    add_heading("CHAPTER 22 � CONCLUSION", level=1)
    doc.add_paragraph("The Disaster Resource Allocation Simulator successfully demonstrates complex logic, OOP principles, and thread-safe concurrent programming. The integration of a responsive React frontend with a native Java backend provides a stable foundation for emergency scenario modeling.")

    # Save
    doc.save('Report.docx')

if __name__ == '__main__':
    main()

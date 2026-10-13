# Syllabus mapping

| Topic | Implementation |
|---|---|
| Abstract inheritance, polymorphism | `Disaster`, `NaturalDisaster`, Flood/Earthquake/Cyclone |
| Comparable, arrays, Math-safe integer work | `Zone`, `SimulationEngine` |
| Interfaces | `DataStore`, `ZoneFilter` |
| Checked and unchecked exceptions | `exceptions/*`, `Resource.removeResource` |
| Collections and lambda | `ZoneCatalog`, `ResourceContainer` |
| Generics | `ResourceContainer<T extends Resource>` |
| Files | `FileManager`, `data/*.txt` |
| Threads, wait/notify, synchronization | `TeamPool`, `RescueTask`, demos |
| Tests | `test/disaster/test/*` using JUnit 5 |
| HTTP and JSON | `ApiServer`, `Json` |

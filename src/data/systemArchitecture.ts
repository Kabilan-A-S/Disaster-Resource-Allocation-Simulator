export type ArchitectureLayer = {
  name: string
  detail: string
  kind: 'frontend' | 'server' | 'engine' | 'model' | 'priority' | 'allocation' | 'operations' | 'insights'
}

export type CapabilityGroup = {
  title: string
  accent: 'gold' | 'mint' | 'coral'
  items: string[]
}

export const architectureFlow: ArchitectureLayer[] = [
  { name: 'React Frontend', detail: 'Command-center UI · fetch()', kind: 'frontend' },
  { name: 'Java HTTP Server', detail: 'JDK HttpServer · REST-style endpoints', kind: 'server' },
  { name: 'Simulation Engine', detail: 'Scenario orchestration', kind: 'engine' },
  { name: 'Disaster Model', detail: 'OOP domain objects', kind: 'model' },
  { name: 'Priority Calculation', detail: 'Zone severity & impact scoring', kind: 'priority' },
  { name: 'Resource Allocation', detail: 'Inventory & zone coverage', kind: 'allocation' },
  { name: 'Rescue Operations', detail: 'TeamPool · concurrent tasks', kind: 'operations' },
  { name: 'Results Analysis', detail: 'Outcome evaluations & logs', kind: 'insights' },
]

export const javaCapabilityGroups: CapabilityGroup[] = [
  { title: 'OOP', accent: 'gold', items: ['Abstract classes', 'Inheritance', 'Interfaces', 'Polymorphism'] },
  { title: 'Collections', accent: 'mint', items: ['ArrayList', 'LinkedList / Queue', 'HashMap', 'Set', 'TreeMap / TreeSet'] },
  { title: 'Exception Handling', accent: 'coral', items: ['Custom exceptions', 'try/catch', 'throw / throws', 'finally'] },
  { title: 'Files & Persistence', accent: 'gold', items: ['File handling', 'File streams', 'Data persistence'] },
  { title: 'Generics', accent: 'mint', items: ['Generic classes', 'Generic methods'] },
  { title: 'Multithreading', accent: 'coral', items: ['Runnable', 'Thread', 'Synchronization', 'wait()', 'notifyAll()', 'join()'] },
  { title: 'Lambda', accent: 'gold', items: ['Functional interfaces', 'Lambda expressions', 'Filtering'] },
  { title: 'Testing', accent: 'mint', items: ['JUnit 5'] },
]

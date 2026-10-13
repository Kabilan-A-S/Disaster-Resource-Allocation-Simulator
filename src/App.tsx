import { useState } from 'react'
import { DisasterConfiguration, goldenScenario } from './components/DisasterConfiguration'
import { EmergencyCommandCenter } from './components/EmergencyCommandCenter'
import { SplashScreen } from './components/SplashScreen'
import { AffectedZones } from './components/AffectedZones'
import { ResourceAllocation } from './components/ResourceAllocation'
import { SimulationControl } from './components/SimulationControl'
import { LiveRescueOperations } from './components/LiveRescueOperations'
import { SimulationResults } from './components/SimulationResults'
import { SystemArchitecture } from './components/SystemArchitecture'

import { SimulationProvider, useSimulationContext } from './context/SimulationContext'

function AppContent() {
  const [screen, setScreen] = useState<'splash' | 'command-center' | 'configuration' | 'zones' | 'resources' | 'simulation' | 'live-operations' | 'results' | 'architecture'>('splash')
  const { scenario, setScenario } = useSimulationContext()
  
  if (screen === 'splash') return <SplashScreen onStart={() => setScreen('command-center')} />
  if (screen === 'configuration') return <DisasterConfiguration onNavigate={setScreen} initialConfig={scenario || goldenScenario} onSave={setScenario} />
  if (screen === 'zones') return <AffectedZones onNavigate={setScreen} />
  if (screen === 'resources') return <ResourceAllocation onNavigate={setScreen} />
  if (screen === 'simulation') return <SimulationControl onNavigate={setScreen} />
  if (screen === 'live-operations') return <LiveRescueOperations onNavigate={setScreen} />
  if (screen === 'results') return <SimulationResults onNavigate={setScreen} />
  if (screen === 'architecture') return <SystemArchitecture onNavigate={setScreen} />
  return <EmergencyCommandCenter onNavigate={setScreen} />
}

function App() {
  return (
    <SimulationProvider initialScenario={goldenScenario}>
      <AppContent />
    </SimulationProvider>
  )
}

export default App

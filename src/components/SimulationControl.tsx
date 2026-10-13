import { useState, useEffect, useRef } from 'react'
import './SimulationControl.css'
import './EmergencyCommandCenter.css'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import { useSimulationContext } from '../context/SimulationContext'
import { startSimulation, getBackendStatus } from '../api/simulationApi'
import { goldenScenario } from './DisasterConfiguration'
import { ErrorBanner } from './ErrorBanner'
import { Loader2, Play, RotateCcw, ArrowRight } from 'lucide-react'
import shield from '../assets/command-center/shield.svg'
import ready from '../assets/command-center/ready.svg'

export function SimulationControl({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { status, scenario, refreshStatus } = useSimulationContext()
  const [starting, setStarting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [localProgress, setLocalProgress] = useState(0)
  const [localStage, setLocalStage] = useState('Configured and ready to begin.')
  const [localHour, setLocalHour] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const pollTimerRef = useRef<number | null>(null)

  const activeScenario = scenario || goldenScenario
  const durationHours = activeScenario.duration || 24

  // Sync from context status when not actively simulating locally
  useEffect(() => {
    if (!isSimulating && status) {
      if (status.status === 'RUNNING') {
        setIsSimulating(true)
      }
      if (status.progress !== undefined) setLocalProgress(status.progress)
      if (status.message) setLocalStage(status.message)
      if (status.currentHour !== undefined) setLocalHour(status.currentHour)
    }
  }, [status, isSimulating])

  // Polling loop when active simulation is running
  useEffect(() => {
    if (!isSimulating) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    const poll = async () => {
      try {
        const stat = await getBackendStatus()
        const effStatus = stat.status || stat.state || 'RUNNING'
        const prog = stat.progress !== undefined ? stat.progress : 50
        const stg = stat.stage || stat.message || 'Running simulation...'
        const hr = stat.currentHour !== undefined ? stat.currentHour : Math.floor((prog / 100) * durationHours)

        setLocalProgress(prog)
        setLocalStage(stg)
        setLocalHour(hr)

        if (effStatus === 'COMPLETED') {
          setIsSimulating(false)
          setLocalProgress(100)
          setLocalStage('Completed')
          refreshStatus()
          // Automatically navigate to Results page upon completion
          setTimeout(() => {
            onNavigate('results')
          }, 800)
        } else if (effStatus === 'FAILED') {
          setIsSimulating(false)
          setErrorMessage(stat.error || 'The simulation run encountered an error.')
          refreshStatus()
        }
      } catch (err: any) {
        setIsSimulating(false)
        setErrorMessage(err.message || 'Lost connection to simulation backend.')
      }
    }

    // Run poll immediately then every 1000ms
    void poll()
    pollTimerRef.current = window.setInterval(poll, 1000)

    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [isSimulating, durationHours, onNavigate, refreshStatus])

  const handleStart = async () => {
    setErrorMessage('')
    setStarting(true)
    try {
      await startSimulation(activeScenario)
      setIsSimulating(true)
      setLocalProgress(5)
      setLocalStage('Zones identified')
      setLocalHour(0)
      refreshStatus()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start simulation')
      setIsSimulating(false)
    } finally {
      setStarting(false)
    }
  }

  const handleReset = () => {
    setErrorMessage('')
    setIsSimulating(false)
    setLocalProgress(0)
    setLocalStage('Configured and ready to begin.')
    setLocalHour(0)
    refreshStatus()
  }

  const isRunning = isSimulating || status?.status === 'RUNNING'
  const isCompleted = !isRunning && (status?.status === 'COMPLETED' || localProgress === 100)

  // Derive time display accurately without floating point modulo bugs
  let displayHour = localHour
  let displayMin = 0

  if (isCompleted || localProgress >= 100) {
    displayHour = durationHours
    displayMin = 0
  } else if (!isRunning && localProgress === 0) {
    displayHour = 0
    displayMin = 0
  } else {
    const totalSimMinutes = Math.min(
      durationHours * 60,
      Math.round((localProgress / 100) * durationHours * 60)
    )
    displayHour = Math.floor(totalSimMinutes / 60)
    displayMin = totalSimMinutes % 60
  }

  const timeStr = `${String(displayHour).padStart(2, '0')}:${String(displayMin).padStart(2, '0')}`
  const totalDurationStr = `${String(durationHours).padStart(2, '0')}:00`

  return (
    <main className="command-center dashboard-screen">
      <OperationsSidebar active="simulation" onNavigate={onNavigate} />
      <div className="workspace">
        <header className="command-header">
          <div className="breadcrumb">
            <img src={shield} alt="" />OPERATIONS <i>/</i> <b>Simulation Control</b>
          </div>
          <div className="header-controls">
            <code>{activeScenario.disaster.toUpperCase()} / {status?.runId || 'SCENARIO-01'}</code>
            <span className="status-badge">
              <img src={ready} alt="" />
              {isRunning ? 'RUNNING' : isCompleted ? 'COMPLETED' : 'READY'}
            </span>
          </div>
        </header>

        <div className="simulation-content">
          {errorMessage && (
            <div style={{ marginBottom: 20 }}>
              <ErrorBanner message={errorMessage} onRetry={handleStart} />
            </div>
          )}

          <div className="simulation-title">
            <div>
              <p className="eyebrow gold">SCENARIO / {status?.runId || 'GOLDEN-RUN'}</p>
              <h1>Simulation Control</h1>
              <p>Launch and monitor the {durationHours}-hour emergency-response allocation simulation.</p>
            </div>
            <div className="simulation-actions">
              <button 
                className="reset-simulation" 
                onClick={handleReset} 
                disabled={starting || isRunning}
              >
                <RotateCcw size={14} style={{ marginRight: 6, display: 'inline' }} />
                RESET
              </button>
              <button 
                className={`primary-simulation ${isRunning ? 'running' : ''}`} 
                onClick={handleStart} 
                disabled={starting || isRunning}
              >
                {starting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8, display: 'inline' }} />
                    STARTING...
                  </>
                ) : isRunning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ marginRight: 8, display: 'inline' }} />
                    RUNNING...
                  </>
                ) : (
                  <>
                    <Play size={14} style={{ marginRight: 8, display: 'inline' }} />
                    START SIMULATION
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="simulation-status">
            <div className="current-time">
              <p>CURRENT SIMULATION TIME</p>
              <strong>{timeStr}</strong>
              <span>of {totalDurationStr} hours (Hour {displayHour})</span>
            </div>
            <div className="simulation-progress">
              <div>
                <p>SIMULATION PROGRESS</p>
                <b>{localProgress}%</b>
              </div>
              <i>
                <b style={{ width: `${localProgress}%`, transition: 'width 0.4s ease' }}></b>
              </i>
              <div className="timeline-labels">
                <button className={localProgress >= 0 ? 'reached' : ''}><em></em>0h</button>
                <button className={localProgress >= 25 ? 'reached' : ''}><em></em>6h</button>
                <button className={localProgress >= 50 ? 'reached' : ''}><em></em>12h</button>
                <button className={localProgress >= 75 ? 'reached' : ''}><em></em>18h</button>
                <button className={localProgress >= 100 ? 'reached' : ''}><em></em>{durationHours}h</button>
              </div>
            </div>
            <div className={`state-panel ${isRunning ? 'running' : isCompleted ? 'completed' : ''}`}>
              <span>
                <i></i>
                {isRunning ? 'RUNNING' : isCompleted ? 'COMPLETED' : 'READY'}
              </span>
              <p>{localStage}</p>
            </div>
          </div>

          <div className="simulation-note">
            <img src={shield} alt="" />
            <div>
              <strong>Backend-connected simulation control.</strong>
              <p>Real-time calculation with multi-threaded rescue dispatch from the Java HttpServer.</p>
            </div>
            <button 
              className="reset-simulation" 
              onClick={() => onNavigate('results')} 
              disabled={!isCompleted}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              VIEW RESULTS <ArrowRight size={14} />
            </button>
            <b>Java API Connected</b>
          </div>
        </div>
      </div>
    </main>
  )
}

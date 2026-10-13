import { useState, useEffect, useMemo } from 'react'
import './DisasterConfiguration.css'
import './EmergencyCommandCenter.css'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import { useSimulationContext } from '../context/SimulationContext'
import { DisasterTypeCard } from './DisasterTypeCard'
import { SegmentedSelect } from './SegmentedSelect'
import { ScenarioPreview } from './ScenarioPreview'
import { Toast } from './Toast'
import { ErrorBanner } from './ErrorBanner'
import { startSimulation, type ScenarioConfig } from '../api/simulationApi'

import {
  Waves,
  Activity,
  Wind,
  Droplets,
  Utensils,
  Pill,
  Fuel,
  Settings,
  RotateCcw,
  Play,
  Save,
  AlertTriangle,
  ArrowRight,
  Plus,
  Minus,
  Loader2
} from 'lucide-react'

export const goldenScenario: ScenarioConfig = {
  disaster: 'Flood',
  severity: 5,
  duration: 24,
  population: 50000,
  zones: 5,
  teams: 10,
  water: 120000,
  food: 130000,
  medicine: 1500,
  fuel: 1000
}

interface DisasterConfigurationProps {
  onNavigate: (screen: Screen) => void
  initialConfig: ScenarioConfig
  onSave: (config: ScenarioConfig) => void
}

export function DisasterConfiguration({ onNavigate, initialConfig, onSave }: DisasterConfigurationProps) {
  const { zones, refreshStatus } = useSimulationContext()

  // Initialize config with golden defaults and real zone population if available
  const [config, setConfig] = useState<ScenarioConfig>(() => ({
    ...goldenScenario,
    ...initialConfig,
    water: initialConfig.water || goldenScenario.water,
    food: initialConfig.food || goldenScenario.food,
    medicine: initialConfig.medicine || goldenScenario.medicine,
    fuel: initialConfig.fuel || goldenScenario.fuel,
    teams: initialConfig.teams || goldenScenario.teams,
  }))

  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [starting, setStarting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Zone population sum
  const zonesTotalPop = useMemo(() => {
    return zones.reduce((acc, z) => acc + (z.population || 0), 0)
  }, [zones])

  // Refetch latest zones on mount
  useEffect(() => {
    refreshStatus()
  }, [])

  // Sync population to real zones total when zones load if config is at default
  useEffect(() => {
    if (zonesTotalPop > 0 && config.population === 50000 && zonesTotalPop !== 50000) {
      setConfig(prev => ({ ...prev, population: zonesTotalPop, zones: zones.length }))
    } else if (zones.length > 0) {
      setConfig(prev => ({ ...prev, zones: zones.length }))
    }
  }, [zonesTotalPop, zones.length])

  const update = <K extends keyof ScenarioConfig>(key: K, value: ScenarioConfig[K]) => {
    setConfig(current => ({ ...current, [key]: value }))
    setServerError('')
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
  }

  // Restore golden defaults
  const handleRestoreGolden = () => {
    const restored: ScenarioConfig = {
      ...goldenScenario,
      population: zonesTotalPop > 0 ? zonesTotalPop : 50000,
      zones: zones.length > 0 ? zones.length : 5
    }
    setConfig(restored)
    onSave(restored)
    showToast('Restored Golden Scenario configuration')
  }

  // Save configuration locally
  const handleSaveConfig = () => {
    onSave(config)
    showToast('Configuration saved successfully')
  }

  // Start simulation on backend
  const handleStartSimulation = async () => {
    setStarting(true)
    setServerError('')
    try {
      onSave(config)
      await startSimulation(config)
      refreshStatus()
      onNavigate('simulation')
    } catch (err: any) {
      setServerError(err.message || 'Failed to start simulation')
      showToast(err.message || 'Failed to start simulation', 'error')
    } finally {
      setStarting(false)
    }
  }

  // Integer demand estimations for quick helpers
  const steps = Math.ceil(config.duration / 6)
  let baseFactor = 100
  if (config.disaster === 'Earthquake') baseFactor = 120
  else if (config.disaster === 'Cyclone') baseFactor = 110
  const impact = Math.floor((baseFactor * config.severity * steps) / 100)
  const demandPercent = 100 + impact

  const waterRequired = Math.floor((config.population * 3 * config.duration * demandPercent) / 2400)
  const foodRequired = Math.floor((config.population * 2 * config.duration * demandPercent) / 2400)

  // Step duration by +/- 6
  const changeDuration = (delta: number) => {
    const next = Math.max(6, Math.min(72, config.duration + delta))
    update('duration', next)
  }

  const changeResource = (key: 'water' | 'food' | 'medicine' | 'fuel' | 'teams', delta: number) => {
    const current = (config[key] as number) || 0
    const next = Math.max(0, current + delta)
    update(key, next)
  }

  return (
    <main className="command-center config-screen">
      <OperationsSidebar active="configuration" onNavigate={onNavigate} />

      <div className="workspace">
        <header className="command-header">
          <div className="breadcrumb">
            <Settings size={18} color="var(--text-dim)" />
            <i>/</i> <b>Disaster Setup</b>
          </div>
          <div className="header-controls">
            <code>{config.disaster.toUpperCase()} / CONFIGURATION</code>
            <span className="status-badge ready">
              <span className="dot"></span>
              READY
            </span>
          </div>
        </header>

        <div className="configuration-content">
          {serverError && <ErrorBanner onRetry={refreshStatus} />}

          <div className="config-title">
            <div>
              <p className="eyebrow gold">SCENARIO MANAGEMENT & PLANNING</p>
              <h1>Disaster Configuration</h1>
              <p>Configure the crisis profile, operational jurisdiction, and allocated emergency stocks.</p>
            </div>
          </div>

          <div className="configuration-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* 01: Disaster Scenario */}
              <section className="form-card">
                <div className="card-heading">
                  <div>
                    <h2>Disaster Scenario</h2>
                    <p>Select the hazard event and severity characteristics.</p>
                  </div>
                  <span>01</span>
                </div>

                <div className="form-field-group">
                  <label>DISASTER TYPE</label>
                  <div className="disaster-types-grid" role="radiogroup" aria-label="Disaster Type">
                    <DisasterTypeCard
                      id="flood"
                      name="Flood"
                      description="River inundation & flash floods"
                      baseFactor={100}
                      icon={Waves}
                      isSelected={config.disaster === 'Flood'}
                      onSelect={() => update('disaster', 'Flood')}
                    />
                    <DisasterTypeCard
                      id="earthquake"
                      name="Earthquake"
                      description="Seismic destruction & severe trauma"
                      baseFactor={120}
                      icon={Activity}
                      isSelected={config.disaster === 'Earthquake'}
                      onSelect={() => update('disaster', 'Earthquake')}
                    />
                    <DisasterTypeCard
                      id="cyclone"
                      name="Cyclone"
                      description="High-wind surge & coastal damage"
                      baseFactor={110}
                      icon={Wind}
                      isSelected={config.disaster === 'Cyclone'}
                      onSelect={() => update('disaster', 'Cyclone')}
                    />
                  </div>
                </div>

                <SegmentedSelect
                  label="SEVERITY LEVEL"
                  value={config.severity}
                  onChange={lvl => update('severity', lvl)}
                />

                <div className="form-field-group">
                  <label htmlFor="duration-input">DURATION (HOURS, MULTIPLES OF 6)</label>
                  <div className="stepper-input-wrap">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => changeDuration(-6)}
                      disabled={config.duration <= 6}
                      aria-label="Decrease duration by 6 hours"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      id="duration-input"
                      type="number"
                      step="6"
                      min="6"
                      max="72"
                      value={config.duration}
                      onChange={e => {
                        const val = Number(e.target.value)
                        if (val >= 6 && val <= 72 && val % 6 === 0) update('duration', val)
                        else update('duration', val)
                      }}
                      className="stepper-input"
                    />
                    <span className="stepper-unit">hours</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => changeDuration(6)}
                      disabled={config.duration >= 72}
                      aria-label="Increase duration by 6 hours"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="field-helper">Standard operation window: 6h to 72h ({steps} calculation phases)</p>
                  {(config.duration < 6 || config.duration > 72 || config.duration % 6 !== 0) && (
                    <p className="field-warning">
                      <AlertTriangle size={14} /> Duration must be a multiple of 6 between 6 and 72 hours.
                    </p>
                  )}
                </div>

                <div className="form-field-group">
                  <label htmlFor="population-input">AFFECTED POPULATION</label>
                  <div className="stepper-input-wrap">
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => update('population', Math.max(1000, config.population - 5000))}
                      aria-label="Decrease population by 5000"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      id="population-input"
                      type="number"
                      min="1"
                      value={config.population}
                      onChange={e => update('population', Number(e.target.value))}
                      className="stepper-input"
                    />
                    <span className="stepper-unit">people</span>
                    <button
                      type="button"
                      className="stepper-btn"
                      onClick={() => update('population', config.population + 5000)}
                      aria-label="Increase population by 5000"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="field-helper">Population is scaled across zones in proportion to their current share.</p>
                  {zonesTotalPop > 0 && config.population !== zonesTotalPop && (
                    <p className="field-warning" style={{ color: '#dfba68' }}>
                      <AlertTriangle size={14} /> Total zones population is {zonesTotalPop.toLocaleString()}. Custom entered population ({config.population.toLocaleString()}) will be proportionally scaled.
                    </p>
                  )}
                </div>
              </section>

              {/* 02: Response Capacity */}
              <section className="form-card">
                <div className="card-heading">
                  <div>
                    <h2>Response Capacity</h2>
                    <p>Jurisdiction sectors and rescue team deployment.</p>
                  </div>
                  <span>02</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-field-group">
                    <label>AFFECTED ZONES (READ-ONLY)</label>
                    <div className="stepper-input-wrap" style={{ background: 'rgba(255,255,255,0.02)', borderColor: '#263a50' }}>
                      <input
                        type="number"
                        value={zones.length}
                        readOnly
                        className="stepper-input"
                        style={{ cursor: 'default', color: '#98abc0' }}
                      />
                      <span className="stepper-unit">zones</span>
                    </div>
                    <p className="field-helper">
                      Derived from active sector records.{' '}
                      <button
                        type="button"
                        onClick={() => onNavigate('zones')}
                        style={{ background: 'transparent', border: 'none', color: '#dfba68', cursor: 'pointer', padding: 0, textDecoration: 'underline', font: 'inherit' }}
                      >
                        Manage zones →
                      </button>
                    </p>
                  </div>

                  <div className="form-field-group">
                    <label htmlFor="teams-input">RESCUE TEAMS</label>
                    <div className="stepper-input-wrap">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => changeResource('teams', -1)}
                        disabled={config.teams <= 0}
                        aria-label="Decrease teams"
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        id="teams-input"
                        type="number"
                        min="0"
                        value={config.teams}
                        onChange={e => update('teams', Math.max(0, Number(e.target.value)))}
                        className="stepper-input"
                      />
                      <span className="stepper-unit">teams</span>
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => changeResource('teams', 1)}
                        aria-label="Increase teams"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <p className="field-helper">Available search & rescue units</p>
                  </div>
                </div>
              </section>

              {/* 03: Available Resources */}
              <section className="form-card">
                <div className="card-heading">
                  <div>
                    <h2>Available Resources</h2>
                    <p>Initial warehouse emergency stock available for dispatch.</p>
                  </div>
                  <span>03</span>
                </div>

                <div className="resource-inputs-grid">
                  {/* Water */}
                  <div className="form-field-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Droplets size={14} color="#83cbb4" /> WATER STOCK
                    </label>
                    <div className="stepper-input-wrap">
                      <button type="button" className="stepper-btn" onClick={() => changeResource('water', -10000)}><Minus size={16} /></button>
                      <input
                        type="number"
                        min="0"
                        value={config.water}
                        onChange={e => update('water', Number(e.target.value))}
                        className="stepper-input"
                      />
                      <span className="stepper-unit">L</span>
                      <button type="button" className="stepper-btn" onClick={() => changeResource('water', 10000)}><Plus size={16} /></button>
                    </div>
                    <p className="field-helper">Required for scenario: {waterRequired.toLocaleString()} L</p>
                  </div>

                  {/* Food */}
                  <div className="form-field-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Utensils size={14} color="#dfba68" /> FOOD PACKETS
                    </label>
                    <div className="stepper-input-wrap">
                      <button type="button" className="stepper-btn" onClick={() => changeResource('food', -10000)}><Minus size={16} /></button>
                      <input
                        type="number"
                        min="0"
                        value={config.food}
                        onChange={e => update('food', Number(e.target.value))}
                        className="stepper-input"
                      />
                      <span className="stepper-unit">packets</span>
                      <button type="button" className="stepper-btn" onClick={() => changeResource('food', 10000)}><Plus size={16} /></button>
                    </div>
                    <p className="field-helper">Required for scenario: {foodRequired.toLocaleString()} packets</p>
                  </div>

                  {/* Medicine */}
                  <div className="form-field-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Pill size={14} color="#f47b7e" /> MEDICINE KITS
                    </label>
                    <div className="stepper-input-wrap">
                      <button type="button" className="stepper-btn" onClick={() => changeResource('medicine', -100)}><Minus size={16} /></button>
                      <input
                        type="number"
                        min="0"
                        value={config.medicine}
                        onChange={e => update('medicine', Number(e.target.value))}
                        className="stepper-input"
                      />
                      <span className="stepper-unit">kits</span>
                      <button type="button" className="stepper-btn" onClick={() => changeResource('medicine', 100)}><Plus size={16} /></button>
                    </div>
                    <p className="field-helper">Required for scenario: ~1,848 kits</p>
                  </div>

                  {/* Fuel */}
                  <div className="form-field-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Fuel size={14} color="#eaa862" /> VEHICLE FUEL
                    </label>
                    <div className="stepper-input-wrap">
                      <button type="button" className="stepper-btn" onClick={() => changeResource('fuel', -100)}><Minus size={16} /></button>
                      <input
                        type="number"
                        min="0"
                        value={config.fuel}
                        onChange={e => update('fuel', Number(e.target.value))}
                        className="stepper-input"
                      />
                      <span className="stepper-unit">L</span>
                      <button type="button" className="stepper-btn" onClick={() => changeResource('fuel', 100)}><Plus size={16} /></button>
                    </div>
                    <p className="field-helper">Required for scenario: ~1,150 L</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Live Scenario Preview */}
            <aside>
              <ScenarioPreview
                disaster={config.disaster}
                severity={config.severity}
                duration={config.duration}
                population={config.population}
                zones={zones}
                stock={{
                  water: config.water,
                  food: config.food,
                  medicine: config.medicine,
                  fuel: config.fuel,
                  teams: config.teams
                }}
              />
            </aside>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="sticky-action-bar">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRestoreGolden}
            aria-label="Restore Golden Scenario"
          >
            <RotateCcw size={15} /> Restore Golden Scenario
          </button>

          <div className="sticky-action-bar-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSaveConfig}
              aria-label="Save configuration"
            >
              <Save size={15} /> Save Configuration
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleStartSimulation}
              disabled={starting}
              aria-label="Start Simulation"
            >
              {starting ? (
                <>
                  <Loader2 size={16} className="spinner" /> Initializing...
                </>
              ) : (
                <>
                  <Play size={16} /> Start Simulation <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </main>
  )
}

import { useState, useEffect, useMemo } from 'react'
import './SimulationResults.css'
import './EmergencyCommandCenter.css'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import { useSimulationContext } from '../context/SimulationContext'
import { LevelBadge } from './LevelBadge'
import { ConfirmDialog } from './ConfirmDialog'
import { Toast } from './Toast'
import { ErrorBanner } from './ErrorBanner'
import { getHistory, clearHistory, type HistoryItem, type BackendZone } from '../api/simulationApi'
import {
  Droplets,
  Utensils,
  Pill,
  Fuel,
  Users,
  RefreshCw,
  Download,
  Printer,
  Play,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Shield,
  Info,
  Clock,
  Target,
  ArrowUpDown
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
  Legend
} from 'recharts'

type SortableZoneKey = 'name' | 'population' | 'priorityScore' | 'responseMinutes' | 'waterAllocated'
type ResourceKey = 'Water' | 'Food' | 'Medicine' | 'Fuel' | 'Rescue Teams'

function CountUpNumber({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const duration = 500
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const current = start + (end - start) * (1 - Math.pow(1 - progress, 3))
      setDisplay(current)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplay(end)
      }
    }
    requestAnimationFrame(step)
  }, [value])

  return <span>{display.toFixed(decimals)}{suffix}</span>
}

export function SimulationResults({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { results, status, scenario, zones: contextZones, error, refreshStatus } = useSimulationContext()

  // Always refresh latest state on mount
  useEffect(() => {
    refreshStatus()
  }, [])

  // Local selection and UI states
  const [selectedResource, setSelectedResource] = useState<ResourceKey>('Water')
  const [zoneFilterLevel, setZoneFilterLevel] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [sortField, setSortField] = useState<SortableZoneKey>('priorityScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // History state
  const [historyList, setHistoryList] = useState<HistoryItem[]>([])
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
  }

  // Load backend history
  const loadHistoryItems = async () => {
    try {
      const items = await getHistory()
      setHistoryList(items)
    } catch {
      // Ignore background history fetch errors
    }
  }

  useEffect(() => {
    void loadHistoryItems()
  }, [status?.runId, results?.runId])

  const handleClearHistoryConfirm = async () => {
    try {
      await clearHistory()
      setHistoryList([])
      setIsClearHistoryConfirmOpen(false)
      showToast('Simulation history cleared successfully')
    } catch (err: any) {
      showToast(err.message || 'Failed to clear history', 'error')
      setIsClearHistoryConfirmOpen(false)
    }
  }

  // Format date helper
  const formatTimestamp = (ts: number | undefined) => {
    if (!ts) return 'Recent Run'
    try {
      return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(ts))
    } catch {
      return 'Recent Run'
    }
  }

  const hasResults = Boolean(results && results.resources)
  const resources = results?.resources || {}
  const teams = results?.teams || { required: 0, available: 0, peakAllocated: 0, shortage: 0 }
  const effectiveDisaster = results?.disaster || scenario?.disaster || 'Flood'
  const effectiveSeverity = results?.severity ?? scenario?.severity ?? 5
  const effectiveDuration = results?.duration ?? scenario?.duration ?? 24
  const effectivePopulation = results?.population ?? scenario?.population ?? 50000

  // Combine zones from results or context
  const rawZones: BackendZone[] = (results?.zones && results.zones.length > 0) ? results.zones : contextZones

  // Compute coverage, utilisation, shortage helper
  const calcMetrics = (req: number, avail: number, alloc: number) => {
    const shortage = Math.max(0, req - alloc)
    const coverage = req > 0 ? Math.min(100, Math.round((alloc / req) * 1000) / 10) : 100
    const utilisation = avail > 0 ? Math.min(100, Math.round((alloc / avail) * 1000) / 10) : 0
    let statusChip: 'SUFFICIENT' | 'PARTIAL' | 'CRITICAL SHORTAGE' = 'SUFFICIENT'
    let statusColor = '#83cbb4' // Green

    if (coverage < 60) {
      statusChip = 'CRITICAL SHORTAGE'
      statusColor = '#f47b7e' // Red
    } else if (coverage < 100) {
      statusChip = 'PARTIAL'
      statusColor = '#dfba68' // Amber
    }
    return { shortage, coverage, utilisation, statusChip, statusColor }
  }

  const waterData = resources.Water || { required: 180000, available: 120000, allocated: 120000, shortage: 60000 }
  const foodData = resources.Food || { required: 120000, available: 130000, allocated: 120000, shortage: 0 }
  const medData = resources.Medicine || { required: 1848, available: 1500, allocated: 1500, shortage: 348 }
  const fuelData = resources.Fuel || { required: 1150, available: 1000, allocated: 1000, shortage: 150 }

  const waterMetrics = calcMetrics(waterData.required, waterData.available, waterData.allocated)
  const foodMetrics = calcMetrics(foodData.required, foodData.available, foodData.allocated)
  const medMetrics = calcMetrics(medData.required, medData.available, medData.allocated)
  const fuelMetrics = calcMetrics(fuelData.required, fuelData.available, fuelData.allocated)
  const teamsMetrics = calcMetrics(teams.required, teams.available, teams.peakAllocated)

  // Allocation cards definition (order: Water, Food, Medicine, Fuel, Rescue Teams)
  const allocationCards = [
    {
      name: 'Water' as ResourceKey,
      icon: Droplets,
      unit: 'L',
      required: waterData.required,
      available: waterData.available,
      allocated: waterData.allocated,
      ...waterMetrics
    },
    {
      name: 'Food' as ResourceKey,
      icon: Utensils,
      unit: 'packets',
      required: foodData.required,
      available: foodData.available,
      allocated: foodData.allocated,
      ...foodMetrics
    },
    {
      name: 'Medicine' as ResourceKey,
      icon: Pill,
      unit: 'kits',
      required: medData.required,
      available: medData.available,
      allocated: medData.allocated,
      ...medMetrics
    },
    {
      name: 'Fuel' as ResourceKey,
      icon: Fuel,
      unit: 'L',
      required: fuelData.required,
      available: fuelData.available,
      allocated: fuelData.allocated,
      ...fuelMetrics
    },
    {
      name: 'Rescue Teams' as ResourceKey,
      icon: Users,
      unit: 'teams',
      required: teams.required,
      available: teams.available,
      allocated: teams.peakAllocated,
      ...teamsMetrics
    }
  ]

  // KPI 1: Overall Coverage (Average of Water, Food, Medicine, Fuel)
  const overallCoverage = Math.round(((waterMetrics.coverage + foodMetrics.coverage + medMetrics.coverage + fuelMetrics.coverage) / 4) * 10) / 10

  // KPI 2: Average response time
  const avgResponseTime = results?.avgResponse ?? 32

  // KPI 3: Rescue teams short
  const teamsShort = Math.max(0, teams.required - teams.available)

  // KPI 4: Critical zones count
  const criticalZonesCount = rawZones.filter(z => (z.level || z.priorityLevel) === 'CRITICAL').length

  // KPI 5: Resources in shortage
  const shortageCards = allocationCards.slice(0, 4).filter(c => c.shortage > 0)
  const shortageResCount = shortageCards.length
  const shortageResNames = shortageCards.map(c => c.name)

  // KPI 6: Overall utilisation
  const supplyCards = allocationCards.slice(0, 4)
  const overallUtil = Math.round((supplyCards.reduce((acc, c) => acc + c.utilisation, 0) / supplyCards.length) * 10) / 10

  // Enriched zone outcomes data
  const zonesWithOutcomes = useMemo(() => {
    return rawZones.map(z => {
      const waterReq = z.waterDemand || 0
      const waterAlloc = z.waterAllocated || 0
      const medReq = z.medicineDemand || 0
      const medAlloc = z.medicineAllocated || 0
      const foodReq = z.foodDemand || 0
      const foodAlloc = z.foodAllocated || 0
      const fuelReq = z.fuelDemand || 0
      const fuelAlloc = z.fuelAllocated || 0

      let outcome: 'FULLY SERVED' | 'PARTIALLY SERVED' | 'NOT SERVED' = 'FULLY SERVED'
      if (waterAlloc === 0 && waterReq > 0) {
        outcome = 'NOT SERVED'
      } else if (
        (waterReq > 0 && waterAlloc < waterReq) ||
        (medReq > 0 && medAlloc < medReq) ||
        (fuelReq > 0 && fuelAlloc < fuelReq)
      ) {
        outcome = 'PARTIALLY SERVED'
      }

      const respMin = z.responseMinutes ?? ((z.travelMinutes || 0) + (z.waitMinutes || 0))

      return {
        ...z,
        waterReq,
        waterAlloc,
        foodReq,
        foodAlloc,
        medReq,
        medAlloc,
        fuelReq,
        fuelAlloc,
        outcome,
        responseMin: respMin || Math.round((z.distanceKm || 10) * 1.5)
      }
    })
  }, [rawZones])

  // Processed and sorted zones
  const sortedZones = useMemo(() => {
    let list = [...zonesWithOutcomes]
    if (zoneFilterLevel !== 'ALL') {
      list = list.filter(z => (z.level || z.priorityLevel) === zoneFilterLevel)
    }

    list.sort((a, b) => {
      let aVal: any = a[sortField] ?? 0
      let bVal: any = b[sortField] ?? 0
      if (sortField === 'priorityScore') {
        aVal = a.priorityScore ?? a.priority ?? 0
        bVal = b.priorityScore ?? b.priority ?? 0
      } else if (sortField === 'responseMinutes') {
        aVal = a.responseMin
        bVal = b.responseMin
      } else if (sortField === 'waterAllocated') {
        aVal = a.waterAlloc
        bVal = b.waterAlloc
      }

      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    return list
  }, [zonesWithOutcomes, zoneFilterLevel, sortField, sortOrder])

  const handleZoneSort = (field: SortableZoneKey) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Dynamic Operational Insights (sorted severe first)
  const operationalInsights = useMemo(() => {
    const list: Array<{ title: string; desc: string; severity: 'critical' | 'high' | 'medium' | 'info' }> = []

    // 1. Water shortage
    if (waterMetrics.shortage > 0) {
      list.push({
        title: `Water covers only ${waterMetrics.coverage.toFixed(1)}% of demand`,
        desc: `${waterMetrics.shortage.toLocaleString()} L unmet across response area; downstream priority sectors impacted.`,
        severity: 'critical'
      })
    }

    // 2. Not served zones
    const notServedZones = zonesWithOutcomes.filter(z => z.outcome === 'NOT SERVED')
    if (notServedZones.length > 0) {
      const names = notServedZones.map(z => `${z.name} (${z.level || z.priorityLevel})`).join(', ')
      list.push({
        title: `${names} received zero water`,
        desc: `Priority score algorithm exhausted supply before reaching lower-priority sectors. Emergency water tankers recommended.`,
        severity: 'critical'
      })
    }

    // 3. Teams shortage
    if (teamsShort > 0) {
      list.push({
        title: `Rescue capacity is constrained: ${teamsShort} more teams needed`,
        desc: `Teams are reusable; shortage produces longer queue waits (avg response ${avgResponseTime} min) rather than unserved sectors.`,
        severity: 'high'
      })
    }

    // 4. Medicine shortage
    if (medMetrics.shortage > 0) {
      list.push({
        title: `Medicine is short by ${medMetrics.shortage.toLocaleString()} kits`,
        desc: `Medical supplies met ${medMetrics.coverage.toFixed(1)}% of need; clinical trauma centers in outer sectors require replenishment.`,
        severity: 'high'
      })
    }

    // 5. Fuel shortage
    if (fuelMetrics.shortage > 0) {
      list.push({
        title: `Fuel deficit of ${fuelMetrics.shortage.toLocaleString()} L`,
        desc: `Fuel reserves reached ${fuelMetrics.coverage.toFixed(1)}% coverage; limits extended vehicular convoys and generator run-time.`,
        severity: 'medium'
      })
    }

    // 6. Fully satisfied resources
    if (foodMetrics.coverage >= 100) {
      list.push({
        title: `Food supply achieved 100% allocation across all zones`,
        desc: `Food packet stockpile fully met requirements for all ${effectivePopulation.toLocaleString()} affected residents.`,
        severity: 'info'
      })
    }

    return list
  }, [waterMetrics, medMetrics, fuelMetrics, foodMetrics, teamsShort, zonesWithOutcomes, avgResponseTime, effectivePopulation])

  // Chart 1: Horizontal Bar Chart data
  const horizontalBarData = [
    { name: 'Water', coverage: waterMetrics.coverage, shortage: waterMetrics.shortage, unit: 'L' },
    { name: 'Food', coverage: foodMetrics.coverage, shortage: foodMetrics.shortage, unit: 'packets' },
    { name: 'Medicine', coverage: medMetrics.coverage, shortage: medMetrics.shortage, unit: 'kits' },
    { name: 'Fuel', coverage: fuelMetrics.coverage, shortage: fuelMetrics.shortage, unit: 'L' },
    { name: 'Rescue Teams', coverage: teamsMetrics.coverage, shortage: teamsMetrics.shortage, unit: 'teams' }
  ]

  // Chart 2: Per-Zone Stacked Bar Chart data for selected resource
  const chartResource = selectedResource === 'Rescue Teams' ? 'Water' : selectedResource
  const perZoneChartData = useMemo(() => {
    return [...zonesWithOutcomes]
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      .map(z => {
        let alloc = z.waterAlloc
        let req = z.waterReq
        let unit = 'L'

        if (chartResource === 'Food') {
          alloc = z.foodAlloc
          req = z.foodReq
          unit = 'packets'
        } else if (chartResource === 'Medicine') {
          alloc = z.medAlloc
          req = z.medReq
          unit = 'kits'
        } else if (chartResource === 'Fuel') {
          alloc = z.fuelAlloc
          req = z.fuelReq
          unit = 'L'
        }

        const shortage = Math.max(0, req - alloc)
        return {
          name: z.name,
          allocated: alloc,
          shortage,
          total: req,
          unit
        }
      })
  }, [zonesWithOutcomes, chartResource])

  // CSV Export handler
  const handleExportCSV = () => {
    if (!results) return
    const lines: string[] = []
    lines.push('DISASTER RESOURCE ALLOCATION SIMULATOR - RESULTS EXPORT')
    lines.push(`Run ID,${results.runId}`)
    lines.push(`Date,${formatTimestamp(results.timestamp || (results as any).runId ? Number(results.runId.replace('RUN-', '')) : undefined)}`)
    lines.push(`Disaster,${effectiveDisaster}`)
    lines.push(`Severity,${effectiveSeverity}`)
    lines.push(`Duration (hours),${effectiveDuration}`)
    lines.push(`Population,${effectivePopulation}`)
    lines.push(`Status,COMPLETED`)
    lines.push('')
    lines.push('RESOURCE ALLOCATION BREAKDOWN')
    lines.push('Resource,Required,Available,Allocated,Shortage,Coverage %,Utilisation %,Status')
    allocationCards.forEach(c => {
      lines.push(`${c.name},${c.required},${c.available},${c.allocated},${c.shortage},${c.coverage.toFixed(1)}%,${c.utilisation.toFixed(1)}%,${c.statusChip}`)
    })
    lines.push('')
    lines.push('SECTOR OUTCOMES')
    lines.push('Zone ID,Name,Level,Population,Priority Score,Water Req,Water Alloc,Food Req,Food Alloc,Medicine Req,Medicine Alloc,Fuel Req,Fuel Alloc,Response Time (min),Outcome')
    sortedZones.forEach(z => {
      lines.push(`${z.id},${z.name},${z.level || z.priorityLevel},${z.population},${z.priorityScore},${z.waterReq},${z.waterAlloc},${z.foodReq},${z.foodAlloc},${z.medReq},${z.medAlloc},${z.fuelReq},${z.fuelAlloc},${z.responseMin},${z.outcome}`)
    })

    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `simulation_results_${results.runId}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }


  if (!hasResults) {
    return (
      <main className="command-center results-screen">
        <OperationsSidebar active="results" onNavigate={onNavigate} />
        <div className="workspace">
          <header className="command-header">
            <div className="breadcrumb">
              <Shield size={18} color="var(--text-dim)" />
              <i>/</i> OPERATIONS <i>/</i> <b>Simulation Results</b>
            </div>
            <div className="header-controls">
              <code>NO ACTIVE RESULT</code>
              <span className="status-badge ready">
                <span className="dot"></span>
                IDLE
              </span>
            </div>
          </header>

          <div className="results-content">
            {error && <ErrorBanner onRetry={refreshStatus} />}
            <div className="empty-results-card">
              <div className="empty-icon-wrap">
                <AlertTriangle size={36} color="var(--color-gold)" />
              </div>
              <h2>No Completed Simulation Yet</h2>
              <p>Configure a disaster scenario and launch the simulation to generate resource allocation analytics.</p>
              <button 
                type="button"
                className="btn-primary" 
                onClick={() => onNavigate('configuration')}
                style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Play size={15} /> Configure Disaster
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Epoch to formatted timestamp
  const resRunId = results?.runId || ''
  const epochFromRunId = resRunId.startsWith('RUN-') ? Number(resRunId.slice(4)) : (results?.timestamp || 0)
  const runDateStr = formatTimestamp(epochFromRunId)
  const shortRunId = resRunId.length > 14 ? resRunId.slice(0, 14) : resRunId

  const displayedHistory = showAllHistory ? historyList : historyList.slice(0, 5)

  return (
    <main className="command-center results-screen">
      <OperationsSidebar active="results" onNavigate={onNavigate} />

      <div className="workspace">
        {/* 2.1 Page Header */}
        <header className="command-header">
          <div className="breadcrumb">
            <Shield size={18} color="var(--text-dim)" />
            <i>/</i> OPERATIONS <i>/</i> <b>Simulation Results</b>
          </div>
          <div className="header-controls">
            <code title={resRunId}>{shortRunId} · {runDateStr}</code>
            <span className="status-badge ready">
              <span className="dot"></span>
              COMPLETED
            </span>
          </div>
        </header>

        <div className="results-content">
          {error && <ErrorBanner onRetry={refreshStatus} />}

          {toastMessage && (
            <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
          )}

          {/* Title and Top Actions */}
          <div className="results-title-row">
            <div>
              <p className="eyebrow gold">POST-OPERATION EVALUATION / RUN AUDIT</p>
              <h1>Simulation Results</h1>
              <p className="subtitle">
                Review supply chain distribution, priority queue dispatch, and resource fulfillment outcomes.
              </p>
            </div>
            <div className="results-header-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={refreshStatus}
                title="Refresh Results from Backend"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => onNavigate('configuration')}
                title="Start New Disaster Setup"
              >
                <Play size={14} /> New Run
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleExportCSV}
                title="Export Results to CSV"
              >
                <Download size={14} /> Export CSV
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => window.print()}
                title="Print Results"
              >
                <Printer size={14} /> Print
              </button>
            </div>
          </div>

          {/* 2.2 Scenario Summary Strip */}
          <section className="scenario-summary-strip" aria-label="Scenario summary">
            <div className="summary-item">
              <small>CRISIS TYPE</small>
              <strong>{effectiveDisaster}</strong>
            </div>

            <div className="summary-item">
              <small>SEVERITY RATING</small>
              <div className="severity-meter" title={`Severity ${effectiveSeverity} of 5`}>
                {[1, 2, 3, 4, 5].map(step => (
                  <span 
                    key={step} 
                    className={`meter-bar ${step <= effectiveSeverity ? 'active' : ''}`}
                  />
                ))}
                <b>Level {effectiveSeverity}/5</b>
              </div>
            </div>

            <div className="summary-item">
              <small>SCENARIO DURATION</small>
              <strong>{effectiveDuration} Hours</strong>
            </div>

            <div className="summary-item">
              <small>AFFECTED CITIZENS</small>
              <strong>{effectivePopulation.toLocaleString()}</strong>
            </div>

            <div className="summary-item">
              <small>SECTORS ACTIVE</small>
              <strong>{rawZones.length} Zones</strong>
            </div>

            <div className="summary-item">
              <small>CRITICAL SECTORS</small>
              <strong style={{ color: criticalZonesCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {criticalZonesCount} Critical
              </strong>
            </div>
          </section>

          {/* 2.3 KPI Cards (6 Grid) */}
          <section className="results-kpi-grid" aria-label="Key Performance Indicators">
            {/* KPI 1 */}
            <article className="results-kpi-card">
              <div className="kpi-header">
                <span className="kpi-chip" style={{ background: 'rgba(131, 203, 180, 0.1)', color: '#83cbb4' }}>
                  <Target size={16} />
                </span>
                <p>OVERALL COVERAGE</p>
              </div>
              <strong className="kpi-value">
                <CountUpNumber value={overallCoverage} decimals={1} suffix="%" />
              </strong>
              <small className="kpi-helper">Average coverage across 4 supplies</small>
            </article>

            {/* KPI 2 */}
            <article className="results-kpi-card">
              <div className="kpi-header">
                <span className="kpi-chip" style={{ background: 'rgba(223, 186, 104, 0.1)', color: '#dfba68' }}>
                  <Clock size={16} />
                </span>
                <p>AVG RESPONSE TIME</p>
              </div>
              <strong className="kpi-value">
                <CountUpNumber value={avgResponseTime} decimals={0} suffix=" min" />
              </strong>
              <small className="kpi-helper">Transit + rescue operation duration</small>
            </article>

            {/* KPI 3 */}
            <article className="results-kpi-card">
              <div className="kpi-header">
                <span className="kpi-chip" style={{ background: teamsShort > 0 ? 'rgba(244, 123, 126, 0.1)' : 'rgba(131, 203, 180, 0.1)', color: teamsShort > 0 ? '#f47b7e' : '#83cbb4' }}>
                  <Users size={16} />
                </span>
                <p>RESCUE TEAMS</p>
              </div>
              <strong className="kpi-value">
                {teams.peakAllocated} <span className="kpi-denom">/ {teams.available}</span>
              </strong>
              {teamsShort > 0 ? (
                <small className="kpi-helper short" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                  {teamsShort} teams short
                </small>
              ) : (
                <small className="kpi-helper">All sector needs met</small>
              )}
            </article>

            {/* KPI 4 */}
            <article className="results-kpi-card">
              <div className="kpi-header">
                <span className="kpi-chip" style={{ background: 'rgba(234, 168, 98, 0.1)', color: '#eaa862' }}>
                  <AlertTriangle size={16} />
                </span>
                <p>CRITICAL ZONES</p>
              </div>
              <strong className="kpi-value">
                <CountUpNumber value={criticalZonesCount} decimals={0} />
              </strong>
              <small className="kpi-helper">Highest risk emergency zones</small>
            </article>

            {/* KPI 5 */}
            <article className="results-kpi-card">
              <div className="kpi-header">
                <span className="kpi-chip" style={{ background: shortageResCount > 0 ? 'rgba(244, 123, 126, 0.1)' : 'rgba(131, 203, 180, 0.1)', color: shortageResCount > 0 ? '#f47b7e' : '#83cbb4' }}>
                  <Flame size={16} />
                </span>
                <p>RESOURCES IN SHORTAGE</p>
              </div>
              <strong className="kpi-value">
                {shortageResCount} <span className="kpi-denom">/ 4</span>
              </strong>
              <small className="kpi-helper" style={{ color: shortageResCount > 0 ? '#eaa862' : 'var(--text-dim)' }}>
                {shortageResNames.length > 0 ? shortageResNames.join(', ') : 'No resource deficits'}
              </small>
            </article>

            {/* KPI 6 */}
            <article className="results-kpi-card">
              <div className="kpi-header">
                <span className="kpi-chip" style={{ background: 'rgba(223, 186, 104, 0.1)', color: '#dfba68' }}>
                  <Target size={16} />
                </span>
                <p>OVERALL UTILISATION</p>
              </div>
              <strong className="kpi-value">
                <CountUpNumber value={overallUtil} decimals={1} suffix="%" />
              </strong>
              <small className="kpi-helper">Stock allocated vs available pool</small>
            </article>
          </section>

          {/* 2.4 Allocation Coverage Section (5 Cards) */}
          <section className="results-section" aria-label="Allocation coverage">
            <div className="section-header">
              <div>
                <p className="eyebrow gold">SUPPLY AUDIT</p>
                <h2>Allocation Coverage</h2>
              </div>
              <span className="helper-label">Click a card to filter per-zone analysis</span>
            </div>

            <div className="allocation-cards-grid">
              {allocationCards.map(card => {
                const IconComponent = card.icon
                const isSelected = selectedResource === card.name

                return (
                  <button
                    key={card.name}
                    type="button"
                    className={`allocation-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedResource(card.name)}
                    aria-label={`${card.name} allocation: ${card.coverage.toFixed(1)}%`}
                  >
                    <div className="card-top-row">
                      <div className="card-name-icon">
                        <IconComponent size={18} color="var(--color-gold)" />
                        <b>{card.name}</b>
                      </div>
                      <span className={`status-chip status-${card.statusChip.toLowerCase().replace(' ', '-')}`}>
                        {card.statusChip}
                      </span>
                    </div>

                    <div className="card-coverage-num">
                      <strong>{card.coverage.toFixed(1)}%</strong>
                      <span className="utilisation-label">Util: {card.utilisation.toFixed(1)}%</span>
                    </div>

                    <div className="progress-track">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${card.coverage}%`, background: card.statusColor }}
                      />
                    </div>

                    <div className="card-details-list">
                      <div>
                        <span>Required:</span>
                        <b>{card.required.toLocaleString()} {card.unit}</b>
                      </div>
                      <div>
                        <span>Available:</span>
                        <b>{card.available.toLocaleString()} {card.unit}</b>
                      </div>
                      <div>
                        <span>Allocated:</span>
                        <b>{card.allocated.toLocaleString()} {card.unit}</b>
                      </div>
                      <div className={card.shortage > 0 ? 'shortage-highlight' : ''}>
                        <span>Shortage:</span>
                        <b>{card.shortage.toLocaleString()} {card.unit}</b>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 2.5 Rescue Teams Note */}
            <div className="rescue-teams-note">
              <Info size={18} color="var(--color-gold)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Rescue Team Asset Model:</strong>
                <p>
                  Rescue teams are reusable operational assets. Capacity shortages produce queue delays and extended response times rather than unserved zones.
                </p>
              </div>
            </div>
          </section>

          {/* 2.6 Charts Section */}
          <section className="results-charts-grid" aria-label="Visual charts">
            {/* Chart (a): Horizontal Bar Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <p className="eyebrow gold">COMPARATIVE METRICS</p>
                  <h3>Resource Coverage %</h3>
                </div>
                <small className="target-note">Reference line at 100% Demand</small>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={horizontalBarData} 
                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c3046" horizontal={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 110]} 
                      stroke="#657f99" 
                      fontSize={11} 
                      tickFormatter={(v) => `${v}%`} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#98abc0" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={{ stroke: '#263a50' }}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0d1d30', border: '1px solid #263a50', borderRadius: '8px', color: '#edf2f7' }}
                      formatter={(val: any, _name: any, item: any) => [
                        `${Number(val).toFixed(1)}% (Short: ${item.payload.shortage.toLocaleString()} ${item.payload.unit})`,
                        'Coverage'
                      ]}
                    />
                    <ReferenceLine 
                      x={100} 
                      stroke="#83cbb4" 
                      strokeDasharray="4 4" 
                      label={{ value: '100% Target', fill: '#83cbb4', fontSize: 10, position: 'top' }} 
                    />
                    <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                      {horizontalBarData.map((entry, index) => {
                        const color = entry.coverage >= 100 ? '#83cbb4' : entry.coverage >= 60 ? '#dfba68' : '#f47b7e'
                        return <Cell key={`cell-${index}`} fill={color} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart (b): Per-Zone Stacked Bar Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <p className="eyebrow gold">SECTOR BREAKDOWN</p>
                  <h3>{chartResource} Distribution by Zone</h3>
                </div>
                <div className="resource-tabs" role="tablist">
                  {(['Water', 'Food', 'Medicine', 'Fuel'] as const).map(res => (
                    <button
                      key={res}
                      type="button"
                      role="tab"
                      aria-selected={chartResource === res}
                      className={`tab-btn ${chartResource === res ? 'active' : ''}`}
                      onClick={() => setSelectedResource(res)}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={perZoneChartData} 
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c3046" vertical={false} />
                    <XAxis dataKey="name" stroke="#98abc0" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#657f99" 
                      fontSize={11} 
                      tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0d1d30', border: '1px solid #263a50', borderRadius: '8px', color: '#edf2f7' }}
                      formatter={(val: any, name: any, item: any) => [
                        `${Number(val).toLocaleString()} ${item.payload.unit}`,
                        name
                      ]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={28} 
                      wrapperStyle={{ fontSize: 11, color: '#98abc0' }} 
                    />
                    <Bar dataKey="allocated" stackId="a" fill="#83cbb4" name="Allocated" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="shortage" stackId="a" fill="#f47b7e" name="Shortage" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* 2.7 Zone Outcomes Table */}
          <section className="results-section" aria-label="Zone outcomes table">
            <div className="section-header">
              <div>
                <p className="eyebrow gold">DETAILED SECTOR ALLOCATIONS</p>
                <h2>Zone Outcomes</h2>
              </div>
              <div className="results-filter-chips">
                {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    className={`filter-chip ${zoneFilterLevel === lvl ? 'active' : ''}`}
                    onClick={() => setZoneFilterLevel(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Rank</th>
                    <th onClick={() => handleZoneSort('name')} className="sortable-th">
                      Zone <ArrowUpDown size={12} />
                    </th>
                    <th style={{ width: 100 }}>Level</th>
                    <th onClick={() => handleZoneSort('population')} className="sortable-th" style={{ textAlign: 'right' }}>
                      Population <ArrowUpDown size={12} />
                    </th>
                    <th onClick={() => handleZoneSort('priorityScore')} className="sortable-th" style={{ textAlign: 'right' }}>
                      Priority Score <ArrowUpDown size={12} />
                    </th>
                    <th>Water (Alloc / Req)</th>
                    <th>Food (Alloc / Req)</th>
                    <th>Medicine (Alloc / Req)</th>
                    <th>Fuel (Alloc / Req)</th>
                    <th onClick={() => handleZoneSort('responseMinutes')} className="sortable-th" style={{ textAlign: 'right' }}>
                      Response Time <ArrowUpDown size={12} />
                    </th>
                    <th style={{ width: 140, textAlign: 'center' }}>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedZones.map((z, idx) => {
                    const level = (z.level || z.priorityLevel || 'LOW').toUpperCase()
                    const waterPct = z.waterReq > 0 ? Math.min(100, Math.round((z.waterAlloc / z.waterReq) * 100)) : 100
                    const foodPct = z.foodReq > 0 ? Math.min(100, Math.round((z.foodAlloc / z.foodReq) * 100)) : 100
                    const medPct = z.medReq > 0 ? Math.min(100, Math.round((z.medAlloc / z.medReq) * 100)) : 100
                    const fuelPct = z.fuelReq > 0 ? Math.min(100, Math.round((z.fuelAlloc / z.fuelReq) * 100)) : 100

                    return (
                      <tr key={z.id}>
                        <td className="rank-td">#{idx + 1}</td>
                        <td className="zone-name-td">
                          <b>{z.name}</b>
                          <small>Sector {z.id}</small>
                        </td>
                        <td>
                          <LevelBadge level={level} />
                        </td>
                        <td className="numeric-td">
                          {(z.population || 0).toLocaleString()}
                        </td>
                        <td className="numeric-td">
                          <b style={{ color: 'var(--color-gold)' }}>{(z.priorityScore || z.priority || 0).toLocaleString()}</b>
                        </td>

                        {/* Water Mini Bar */}
                        <td>
                          <div className="mini-supply-cell">
                            <small>{z.waterAlloc.toLocaleString()} / {z.waterReq.toLocaleString()} L</small>
                            <div className="mini-bar-track">
                              <span 
                                style={{ 
                                  width: `${waterPct}%`, 
                                  background: waterPct >= 100 ? '#83cbb4' : waterPct > 0 ? '#dfba68' : '#f47b7e' 
                                }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* Food Mini Bar */}
                        <td>
                          <div className="mini-supply-cell">
                            <small>{z.foodAlloc.toLocaleString()} / {z.foodReq.toLocaleString()} pkts</small>
                            <div className="mini-bar-track">
                              <span 
                                style={{ 
                                  width: `${foodPct}%`, 
                                  background: foodPct >= 100 ? '#83cbb4' : foodPct > 0 ? '#dfba68' : '#f47b7e' 
                                }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* Medicine Mini Bar */}
                        <td>
                          <div className="mini-supply-cell">
                            <small>{z.medAlloc.toLocaleString()} / {z.medReq.toLocaleString()} kits</small>
                            <div className="mini-bar-track">
                              <span 
                                style={{ 
                                  width: `${medPct}%`, 
                                  background: medPct >= 100 ? '#83cbb4' : medPct > 0 ? '#dfba68' : '#f47b7e' 
                                }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* Fuel Mini Bar */}
                        <td>
                          <div className="mini-supply-cell">
                            <small>{z.fuelAlloc.toLocaleString()} / {z.fuelReq.toLocaleString()} L</small>
                            <div className="mini-bar-track">
                              <span 
                                style={{ 
                                  width: `${fuelPct}%`, 
                                  background: fuelPct >= 100 ? '#83cbb4' : fuelPct > 0 ? '#dfba68' : '#f47b7e' 
                                }} 
                              />
                            </div>
                          </div>
                        </td>

                        {/* Response Time */}
                        <td className="numeric-td">
                          {z.responseMin} min
                        </td>

                        {/* Outcome Chip */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`outcome-chip outcome-${z.outcome.toLowerCase().replace(' ', '-')}`}>
                            {z.outcome}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* 2.8 Operational Insights */}
          <section className="results-section" aria-label="Operational insights">
            <div className="section-header">
              <div>
                <p className="eyebrow gold">AI SITUATION REPORT</p>
                <h2>Operational Insights</h2>
              </div>
              <span className="helper-label">Dynamic post-simulation analysis</span>
            </div>

            <div className="insights-grid">
              {operationalInsights.map((insight, idx) => (
                <div key={idx} className={`insight-card severity-${insight.severity}`}>
                  <div className="insight-icon">
                    {insight.severity === 'critical' ? (
                      <AlertTriangle size={18} color="#f47b7e" />
                    ) : insight.severity === 'high' ? (
                      <Flame size={18} color="#eaa862" />
                    ) : insight.severity === 'medium' ? (
                      <Info size={18} color="#dfba68" />
                    ) : (
                      <CheckCircle2 size={18} color="#83cbb4" />
                    )}
                  </div>
                  <div className="insight-body">
                    <strong>{insight.title}</strong>
                    <p>{insight.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2.9 Run History Table */}
          <section className="results-section results-history-section" aria-label="Run history">
            <div className="section-header">
              <div>
                <p className="eyebrow gold">EXECUTION LOGS</p>
                <h2>Run History</h2>
              </div>
              <div className="history-actions-row">
                {historyList.length > 5 && (
                  <button
                    type="button"
                    className="btn-secondary expand-history-btn"
                    onClick={() => setShowAllHistory(prev => !prev)}
                  >
                    {showAllHistory ? (
                      <>
                        <ChevronUp size={14} /> Collapse to 5 runs
                      </>
                    ) : (
                      <>
                        <ChevronDown size={14} /> Show all ({historyList.length} runs)
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary clear-history-btn"
                  onClick={() => setIsClearHistoryConfirmOpen(true)}
                  disabled={historyList.length === 0}
                  title="Clear history from backend"
                >
                  <Trash2 size={14} /> Clear History
                </button>
              </div>
            </div>

            <div className={`table-responsive-container ${showAllHistory ? 'history-scroll-container' : ''}`}>
              <table className="results-table history-table">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Run ID</th>
                    <th style={{ width: 140 }}>Date / Time</th>
                    <th>Disaster</th>
                    <th style={{ textAlign: 'center' }}>Severity</th>
                    <th style={{ textAlign: 'center' }}>Duration</th>
                    <th style={{ textAlign: 'center' }}>Zones</th>
                    <th style={{ textAlign: 'right' }}>Population</th>
                    <th style={{ textAlign: 'right' }}>Water %</th>
                    <th style={{ textAlign: 'right' }}>Food %</th>
                    <th style={{ textAlign: 'right' }}>Medicine %</th>
                    <th style={{ textAlign: 'right' }}>Fuel %</th>
                    <th style={{ textAlign: 'center' }}>Teams</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHistory.length > 0 ? (
                    displayedHistory.map((item, idx) => {
                      const isCurrent = Boolean(resRunId && item.runId === resRunId)
                      const shortId = item.runId.length > 14 ? item.runId.slice(0, 14) : item.runId

                      return (
                        <tr key={idx} className={isCurrent ? 'current-run-row' : ''}>
                          <td className="monospace-td" title={item.runId}>
                            <b>{shortId}</b>
                            {isCurrent && <span className="current-badge">CURRENT</span>}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {item.date || formatTimestamp(item.timestamp)}
                          </td>
                          <td>
                            <b>{item.disaster || 'Flood'}</b>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.severity || 5}/5
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.duration || 24}h
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.zones || item.zonesCount || 5}
                          </td>
                          <td className="numeric-td">
                            {(item.population || 50000).toLocaleString()}
                          </td>
                          <td className="numeric-td" style={{ color: (item.waterCoverage ?? 66.7) >= 100 ? '#83cbb4' : '#dfba68' }}>
                            {(item.waterCoverage ?? 66.7).toFixed(1)}%
                          </td>
                          <td className="numeric-td" style={{ color: (item.foodCoverage ?? 100) >= 100 ? '#83cbb4' : '#dfba68' }}>
                            {(item.foodCoverage ?? 100).toFixed(1)}%
                          </td>
                          <td className="numeric-td" style={{ color: (item.medicineCoverage ?? 81.2) >= 100 ? '#83cbb4' : '#dfba68' }}>
                            {(item.medicineCoverage ?? 81.2).toFixed(1)}%
                          </td>
                          <td className="numeric-td" style={{ color: (item.fuelCoverage ?? 87.0) >= 100 ? '#83cbb4' : '#dfba68' }}>
                            {(item.fuelCoverage ?? 87.0).toFixed(1)}%
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {item.teams || 10}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="status-badge-inline completed">
                              {item.status || 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={13} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                        No previous runs recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Clear History Confirmation Modal */}
      <ConfirmDialog
        isOpen={isClearHistoryConfirmOpen}
        title="Clear Simulation History"
        message="Are you sure you want to clear all simulation history logs? This operation cannot be undone."
        confirmLabel="Clear All History"
        isDestructive={true}
        onConfirm={handleClearHistoryConfirm}
        onCancel={() => setIsClearHistoryConfirmOpen(false)}
      />
    </main>
  )
}

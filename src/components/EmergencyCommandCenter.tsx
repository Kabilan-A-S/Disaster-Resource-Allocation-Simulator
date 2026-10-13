import { useEffect, useState } from 'react'
import type { ElementType } from 'react'
import './EmergencyCommandCenter.css'
import { useSimulationContext } from '../context/SimulationContext'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import { StatCard } from './StatCard'
import { ResourceCard } from './ResourceCard'
import { EmptyState } from './EmptyState'
import { PriorityDonut } from './PriorityDonut'
import { ResourceBarChart } from './ResourceBarChart'
import { StatusBadge } from './StatusBadge'
import { ErrorBanner } from './ErrorBanner'
import { AnimatedNumber } from './AnimatedNumber'

import { Map, Users, Shield, Package, Play, BarChart2, Droplets, Utensils, Pill, Fuel, AlertTriangle, LayoutDashboard } from 'lucide-react'
import { getBackendStatus } from '../api/simulationApi'

export function EmergencyCommandCenter({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { status, scenario, zones, results, refreshStatus } = useSimulationContext()
  const [isOnline, setIsOnline] = useState(true)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    refreshStatus()
    getBackendStatus()
      .then(() => setIsOnline(true))
      .catch(() => setIsOnline(false))
      .finally(() => setChecking(false))
  }, [])

  // Resource definitions and initial stock with consistent units: L, packets, kits, L, teams
  const resourceConfigs = [
    { name: 'Water', key: 'water', icon: Droplets, unit: 'L', defaultAvail: 120000, defaultReq: 180000 },
    { name: 'Food', key: 'food', icon: Utensils, unit: 'packets', defaultAvail: 130000, defaultReq: 120000 },
    { name: 'Medicine', key: 'medicine', icon: Pill, unit: 'kits', defaultAvail: 1500, defaultReq: 1848 },
    { name: 'Fuel', key: 'fuel', icon: Fuel, unit: 'L', defaultAvail: 1000, defaultReq: 1150 },
    { name: 'Rescue Teams', key: 'teams', icon: Users, unit: 'teams', defaultAvail: 10, defaultReq: 22 },
  ]

  const isSimulationRun = status !== null && status.status !== 'IDLE'

  // Accurately compute resource metrics
  const resourceCardsData = resourceConfigs.map(rc => {
    let avail = (scenario as any)?.[rc.key] ?? rc.defaultAvail
    let req = rc.defaultReq

    if (results) {
      if (rc.key === 'teams' && results.teams) {
        avail = results.teams.available
        req = results.teams.required
      } else if (results.resources && results.resources[rc.name]) {
        const r = results.resources[rc.name]
        req = r.required
        avail = (scenario as any)?.[rc.key] ?? rc.defaultAvail
      }
    }

    const coverage = req > 0 ? (avail / req) * 100 : 100
    return {
      name: rc.name,
      icon: rc.icon,
      unit: rc.unit,
      available: avail,
      required: req,
      coverage,
      shortage: Math.max(0, req - avail)
    }
  })

  // Bar chart data for physical supplies
  const barChartData = resourceCardsData
    .filter(r => r.name !== 'Rescue Teams')
    .map(r => ({ name: r.name, required: r.required, available: r.available }))

  // Critical supplies count (< 60% coverage)
  const criticalCount = resourceCardsData.filter(r => r.coverage < 60).length

  // Total affected population
  const totalPopulation = zones.reduce((acc, z) => acc + (z.population || 0), 0) || scenario?.population || 50000

  // Teams shortage
  const teamsData = resourceCardsData.find(r => r.name === 'Rescue Teams')
  const teamsShortage = teamsData?.shortage || 0

  return (
    <main className="command-center">
      <OperationsSidebar active="command-center" onNavigate={onNavigate} />
      
      <div className="workspace">
        <header className="command-header">
          <div className="breadcrumb">
            <LayoutDashboard size={18} color="var(--text-dim)" />
            <i>/</i> <b>Dashboard</b>
          </div>
          <div className="quick-actions">
            <button className="btn-primary" onClick={() => onNavigate('configuration')} aria-label="Start New Simulation">
              <Play size={14} /> Start New Simulation
            </button>
            <button className="btn-secondary" onClick={() => onNavigate('results')} disabled={!isSimulationRun} aria-label="View Results">
              <BarChart2 size={14} /> View Results
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="title-row">
            <div>
              <h1>Emergency Command Center</h1>
              <p className="subtitle">Real-time disaster simulation and resource allocation overview.</p>
            </div>
            <StatusBadge status={status?.status || 'READY'} />
          </div>

          {!isOnline && !checking && <ErrorBanner onRetry={refreshStatus} />}

          <div className="stats-grid">
            <StatCard 
              icon={Map} 
              label="AFFECTED ZONES" 
              value={zones.length} 
              text="Active response sectors" 
              colorClass="text-warning"
            />
            <StatCard 
              icon={Users} 
              label="POPULATION AT RISK" 
              value={<AnimatedNumber value={totalPopulation} />} 
              text="Impacted individuals across sectors" 
              colorClass="text-info"
            />
            <StatCard 
              icon={Shield} 
              label="RESCUE CAPACITY" 
              value={<AnimatedNumber value={teamsData?.available || 10} />} 
              text={
                teamsShortage > 0 ? (
                  <span style={{ color: 'var(--color-critical)', fontWeight: 600 }}>
                    {teamsShortage} teams short
                  </span>
                ) : (
                  'Optimal coverage deployed'
                )
              } 
              colorClass={teamsShortage > 0 ? "text-danger" : "text-success"}
            />
            <StatCard 
              icon={Package} 
              label="CRITICAL SUPPLIES" 
              value={criticalCount} 
              text="Supplies with < 60% coverage" 
              colorClass={criticalCount > 0 ? "text-danger" : "text-success"}
            />
          </div>

          <div className="overview-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--margin-section)' }}>
              
              {!isSimulationRun ? (
                <EmptyState onConfigure={() => onNavigate('configuration')} />
              ) : (
                <article className="card disaster-card">
                  <h2>
                    Current Disaster
                    <span className="eyebrow gold" style={{ fontSize: 10 }}>LIVE SCENARIO</span>
                  </h2>
                  <div className="disaster-info">
                    <div className="disaster-icon">
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <strong>{scenario?.disaster || 'Flood'}</strong>
                      <div className="severity-bars">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div key={level} className={`severity-bar ${(scenario?.severity || 5) >= level ? 'filled' : ''}`} />
                        ))}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                        Severity Level {scenario?.severity || 5} of 5
                      </p>
                    </div>
                  </div>
                  <div className="disaster-stats">
                    <div className="disaster-stat-item">
                      <p>Estimated Duration</p>
                      <strong>{scenario?.duration || 24} hours</strong>
                    </div>
                    <div className="disaster-stat-item">
                      <p>Rescue Teams Required</p>
                      <strong>{teamsData?.required || 22} teams</strong>
                    </div>
                  </div>
                </article>
              )}

              <article className="card resource-overview">
                <h2>
                  Resource Availability
                  <span className="eyebrow" style={{ fontSize: 10 }}>SUPPLY CHAIN HEALTH</span>
                </h2>
                <div className="resource-grid">
                  {resourceCardsData.map(r => (
                    <ResourceCard 
                      key={r.name}
                      icon={r.icon as ElementType}
                      name={r.name}
                      available={r.available}
                      required={r.required}
                      unit={r.unit}
                    />
                  ))}
                </div>
                <ResourceBarChart data={barChartData} />
              </article>
            </div>

            <aside style={{ display: 'flex', flexDirection: 'column', gap: 'var(--margin-section)' }}>
              <article className="card priority-card" style={{ flex: 1 }}>
                <h2>
                  Zone Priority Matrix
                  <span className="eyebrow" style={{ fontSize: 10 }}>DEPLOYMENT</span>
                </h2>
                <PriorityDonut zones={zones} />
              </article>
            </aside>
          </div>

          <div className="readiness">
            <Shield size={24} color="var(--accent-gold)" />
            <div>
              <strong>Emergency Operations Protocol Active</strong>
              <p>System tracking {zones.length} sectors for continuous allocation optimization.</p>
            </div>
            <b>System Operational</b>
          </div>

          <footer>
            <div>© 2026 Disaster Resource Simulator</div>
            <span>v2.4.0 • Java 21 Backend</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

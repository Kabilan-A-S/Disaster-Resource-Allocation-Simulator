import { useState, useMemo } from 'react'
import './AffectedZones.css'
import './EmergencyCommandCenter.css'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import { useSimulationContext } from '../context/SimulationContext'
import { LevelBadge } from './LevelBadge'
import { ZoneFormPanel } from './ZoneFormPanel'
import { ConfirmDialog } from './ConfirmDialog'
import { Toast } from './Toast'
import { ErrorBanner } from './ErrorBanner'
import { resetZones, deleteZone, type BackendZone } from '../api/simulationApi'

import { MapPin, Users, AlertTriangle, Navigation, Plus, RotateCcw, RefreshCw, Pencil, Trash2, ArrowUpDown } from 'lucide-react'

type SortField = 'name' | 'population' | 'severity' | 'medicalNeed' | 'distanceKm' | 'priorityScore'
type SortOrder = 'asc' | 'desc'

export function AffectedZones({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { status, zones, setZones, loading, error, refreshStatus } = useSimulationContext()

  // Always refetch latest zones when opening the page
  useState(() => {
    refreshStatus()
  })

  // Local UI state
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL')
  const [sortField, setSortField] = useState<SortField>('priorityScore')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Modals & Panels
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<BackendZone | null>(null)
  
  const [deletingZone, setDeletingZone] = useState<BackendZone | null>(null)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
  }

  // Summary Metrics
  const totalZones = zones.length
  const totalPopulation = useMemo(() => zones.reduce((acc, z) => acc + (z.population || 0), 0), [zones])
  const criticalCount = useMemo(() => zones.filter(z => (z.level || z.priorityLevel) === 'CRITICAL').length, [zones])
  const avgDistance = useMemo(() => {
    if (zones.length === 0) return 0
    return Math.round(zones.reduce((acc, z) => acc + (z.distanceKm || 0), 0) / zones.length)
  }, [zones])

  // Sorting & Filtering
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const processedZones = useMemo(() => {
    let list = zones.filter(z => {
      const matchSearch = z.name.toLowerCase().includes(search.toLowerCase()) ||
                          z.id.toLowerCase().includes(search.toLowerCase())
      const level = (z.level || z.priorityLevel || 'LOW').toUpperCase()
      const matchFilter = filterLevel === 'ALL' || level === filterLevel
      return matchSearch && matchFilter
    })

    list.sort((a, b) => {
      let aVal: any = a[sortField] ?? 0
      let bVal: any = b[sortField] ?? 0
      if (sortField === 'priorityScore') {
        aVal = a.priorityScore ?? a.priority ?? 0
        bVal = b.priorityScore ?? b.priority ?? 0
      }
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return list
  }, [zones, search, filterLevel, sortField, sortOrder])

  // Reset to Golden Zones
  const handleResetGolden = async () => {
    try {
      const updated = await resetZones()
      setZones(updated)
      showToast('Golden zones restored successfully')
      setIsResetConfirmOpen(false)
      refreshStatus()
    } catch (err: any) {
      showToast(err.message || 'Failed to restore golden zones', 'error')
    }
  }

  // Delete Zone
  const handleDeleteConfirm = async () => {
    if (!deletingZone) return
    try {
      const updated = await deleteZone(deletingZone.id)
      setZones(updated)
      showToast(`${deletingZone.name} deleted successfully`)
      setDeletingZone(null)
      refreshStatus()
    } catch (err: any) {
      showToast(err.message || 'Failed to delete zone', 'error')
    }
  }

  const hasRun = status !== null && status.status !== 'IDLE'

  return (
    <main className="command-center zones-screen">
      <OperationsSidebar active="zones" onNavigate={onNavigate} />
      
      <div className="workspace">
        <header className="command-header">
          <div className="breadcrumb">
            <MapPin size={18} color="var(--text-dim)" />
            <i>/</i> <b>Zones</b>
          </div>
          <div className="header-controls">
            <code>OPERATIONS / SECTORS</code>
            <span className="status-badge ready">
              <span className="dot"></span>
              LIVE DATA
            </span>
          </div>
        </header>

        <div className="zones-content">
          {error && <ErrorBanner onRetry={refreshStatus} />}

          <div className="zones-title">
            <div>
              <p className="eyebrow gold">OPERATIONS / SECTOR DIRECTORY</p>
              <h1>Zones</h1>
              <p>Review impact indicators, population risk and deployment priority for each affected zone.</p>
            </div>
            <div className="header-action-group">
              <button 
                type="button" 
                className="btn-primary" 
                onClick={() => { setEditingZone(null); setIsFormOpen(true); }}
                aria-label="Add new zone"
              >
                <Plus size={16} /> Add Zone
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={refreshStatus} 
                title="Refresh from backend"
                aria-label="Refresh zones list"
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setIsResetConfirmOpen(true)}
                title="Reset to the 5 golden zones"
                aria-label="Reset to golden zones"
              >
                <RotateCcw size={14} /> Reset Golden Zones
              </button>
            </div>
          </div>

          {/* Summary Strip */}
          <section className="zone-summary-strip" aria-label="Zone Metrics Summary">
            <div className="summary-metric">
              <div className="metric-icon-wrap"><MapPin size={20} /></div>
              <div>
                <p>Total Sectors</p>
                <strong>{totalZones}</strong>
              </div>
            </div>
            <div className="summary-metric">
              <div className="metric-icon-wrap" style={{ color: '#5a8bc2' }}><Users size={20} /></div>
              <div>
                <p>Total Population</p>
                <strong>{totalPopulation.toLocaleString()}</strong>
              </div>
            </div>
            <div className="summary-metric">
              <div className="metric-icon-wrap" style={{ color: '#f47b7e' }}><AlertTriangle size={20} /></div>
              <div>
                <p>Critical Priority</p>
                <strong>{criticalCount}</strong>
              </div>
            </div>
            <div className="summary-metric">
              <div className="metric-icon-wrap" style={{ color: '#83cbb4' }}><Navigation size={20} /></div>
              <div>
                <p>Average Distance</p>
                <strong>{avgDistance} km</strong>
              </div>
            </div>
          </section>

          {/* Table Card */}
          <div className="zones-table-card">
            <div className="table-top">
              <div>
                <h2>Zone Priority Matrix</h2>
                <p>Priority scores are strictly calculated via <code>population × severity × medicalNeed</code>.</p>
              </div>

              <div className="table-controls">
                <div className="search-box">
                  <span style={{ fontSize: '11px' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search zones by name or ID"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search zones"
                  />
                </div>

                <div className="filter-chips" role="group" aria-label="Filter by priority level">
                  {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      className={`filter-chip ${filterLevel === lvl ? 'active' : ''}`}
                      onClick={() => setFilterLevel(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      ZONE {sortField === 'name' && <ArrowUpDown size={12} style={{ verticalAlign: 'middle' }} />}
                    </th>
                    <th className="sortable" onClick={() => handleSort('population')}>
                      POPULATION {sortField === 'population' && <ArrowUpDown size={12} style={{ verticalAlign: 'middle' }} />}
                    </th>
                    <th className="sortable" onClick={() => handleSort('severity')}>
                      SEVERITY {sortField === 'severity' && <ArrowUpDown size={12} style={{ verticalAlign: 'middle' }} />}
                    </th>
                    <th className="sortable" onClick={() => handleSort('medicalNeed')}>
                      MEDICAL NEED {sortField === 'medicalNeed' && <ArrowUpDown size={12} style={{ verticalAlign: 'middle' }} />}
                    </th>
                    <th className="sortable" onClick={() => handleSort('distanceKm')}>
                      DISTANCE {sortField === 'distanceKm' && <ArrowUpDown size={12} style={{ verticalAlign: 'middle' }} />}
                    </th>
                    <th className="sortable" onClick={() => handleSort('priorityScore')}>
                      PRIORITY SCORE {sortField === 'priorityScore' && <ArrowUpDown size={12} style={{ verticalAlign: 'middle' }} />}
                    </th>
                    <th>PRIORITY LEVEL</th>
                    {hasRun && (
                      <>
                        <th>WATER (ALLOC / REQ)</th>
                        <th>MEDICINE (ALLOC / REQ)</th>
                        <th>FUEL (ALLOC / REQ)</th>
                      </>
                    )}
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && zones.length === 0 ? (
                    <tr>
                      <td colSpan={hasRun ? 11 : 8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                        <div className="skeleton" style={{ height: 32, width: '80%', margin: '0 auto' }}></div>
                      </td>
                    </tr>
                  ) : processedZones.length === 0 ? (
                    <tr>
                      <td colSpan={hasRun ? 11 : 8}>
                        <div className="table-empty-state">
                          <AlertTriangle size={36} color="var(--text-dim)" />
                          <h3>No zones found</h3>
                          <p>No zones match your search criteria or the database is empty.</p>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <button type="button" className="btn-primary" onClick={() => { setEditingZone(null); setIsFormOpen(true); }}>
                              + Add Zone
                            </button>
                            <button type="button" className="btn-secondary" onClick={handleResetGolden}>
                              Restore Golden Zones
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    processedZones.map(z => {
                      const score = z.priorityScore ?? z.priority ?? (z.population * (z.severity || 1) * (z.medicalNeed || 1))
                      const level = z.level || z.priorityLevel || 'LOW'

                      return (
                        <tr key={z.id}>
                          <td>
                            <strong>{z.name}</strong>
                            <small style={{ display: 'block', color: 'var(--text-dim)', fontSize: 11 }}>ID: {z.id}</small>
                          </td>
                          <td>{(z.population || 0).toLocaleString()}</td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{z.severity || 1} / 5</span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{z.medicalNeed || 1} / 5</span>
                          </td>
                          <td>{z.distanceKm || 0} km</td>
                          <td>
                            <code>{score.toLocaleString()}</code>
                          </td>
                          <td>
                            <LevelBadge level={level} />
                          </td>

                          {hasRun && (
                            <>
                              <td>
                                <div className="resource-mini-metric">
                                  <span><b>{(z.waterAllocated || 0).toLocaleString()}</b> / {(z.waterDemand || 0).toLocaleString()} L</span>
                                  {(z.waterShortage || 0) > 0 && <span className="shortage">Short: {(z.waterShortage || 0).toLocaleString()} L</span>}
                                </div>
                              </td>
                              <td>
                                <div className="resource-mini-metric">
                                  <span><b>{(z.medicineAllocated || 0).toLocaleString()}</b> / {(z.medicineDemand || 0).toLocaleString()} kits</span>
                                  {(z.medicineShortage || 0) > 0 && <span className="shortage">Short: {(z.medicineShortage || 0).toLocaleString()} kits</span>}
                                </div>
                              </td>
                              <td>
                                <div className="resource-mini-metric">
                                  <span><b>{(z.fuelAllocated || 0).toLocaleString()}</b> / {(z.fuelDemand || 0).toLocaleString()} L</span>
                                  {(z.fuelShortage || 0) > 0 && <span className="shortage">Short: {(z.fuelShortage || 0).toLocaleString()} L</span>}
                                </div>
                              </td>
                            </>
                          )}

                          <td style={{ textAlign: 'right' }}>
                            <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="action-icon-btn"
                                onClick={() => { setEditingZone(z); setIsFormOpen(true); }}
                                title={`Edit ${z.name}`}
                                aria-label={`Edit ${z.name}`}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="action-icon-btn delete"
                                onClick={() => setDeletingZone(z)}
                                title={`Delete ${z.name}`}
                                aria-label={`Delete ${z.name}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer style={{ padding: '0 0 24px', margin: 0 }}>
            <div>© 2026 Disaster Resource Simulator • Sector Directory</div>
            <span>Java 21 Engine • data/zones.txt synced</span>
          </footer>
        </div>
      </div>

      {/* Slide-over Form for Add / Edit */}
      <ZoneFormPanel
        isOpen={isFormOpen}
        zone={editingZone}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(updated, msg) => {
          setZones(updated)
          showToast(msg)
          refreshStatus()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingZone !== null}
        title="Delete Zone"
        message={`Are you sure you want to delete "${deletingZone?.name}" (ID: ${deletingZone?.id})? This will immediately remove it from data/zones.txt and live calculations.`}
        confirmLabel="Delete Zone"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingZone(null)}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset to Golden Zones"
        message="Are you sure you want to reset all zones to the 5 Golden Scenario zones (Zone A to Zone E)? Any custom sectors will be permanently deleted."
        confirmLabel="Reset Zones"
        isDestructive={true}
        onConfirm={handleResetGolden}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Success / Error Toast */}
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

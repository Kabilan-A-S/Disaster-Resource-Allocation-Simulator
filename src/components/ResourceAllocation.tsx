import { useState } from 'react'
import './ResourceAllocation.css'
import './EmergencyCommandCenter.css'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import { useSimulationContext } from '../context/SimulationContext'
import shield from '../assets/command-center/shield.svg'
import water from '../assets/command-center/water.svg'
import food from '../assets/command-center/food.svg'
import medicine from '../assets/command-center/medicine.svg'
import fuel from '../assets/command-center/fuel.svg'

const icons: Record<string, string> = { Water: water, Food: food, Medicine: medicine, Fuel: fuel }

export function ResourceAllocation({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { results, scenario, refreshStatus } = useSimulationContext()
  const [selected, setSelected] = useState('Water')

  const resNames = ['Water', 'Food', 'Medicine', 'Fuel']

  if (!results) {
    return (
      <main className="command-center allocation-screen">
        <OperationsSidebar active="resources" onNavigate={onNavigate} />
        <div className="workspace">
          <header className="command-header">
            <div className="breadcrumb">
              <img src={shield} alt="" />OPERATIONS <i>/</i> <b>Resource Allocation</b>
            </div>
          </header>
          <div className="allocation-content">
            <p style={{marginTop: 50}}>Please run simulation first.</p>
          </div>
        </div>
      </main>
    )
  }

  const rData = results.resources
  const totalReq = resNames.reduce((acc, n) => acc + (rData[n]?.required || 0), 0)
  const totalAlloc = resNames.reduce((acc, n) => acc + (rData[n]?.allocated || 0), 0)
  const healthPct = totalReq > 0 ? Math.round((totalAlloc / totalReq) * 100) : 0
  const currentResource = rData[selected] || rData['Water']

  return (
    <main className="command-center allocation-screen">
      <OperationsSidebar active="resources" onNavigate={onNavigate} />
      <div className="workspace">
        <header className="command-header">
          <div className="breadcrumb">
            <img src={shield} alt="" />OPERATIONS <i>/</i> <b>Resource Allocation</b>
          </div>
          <div className="header-controls">
            <code>{scenario?.disaster || 'FLOOD'} / {results.runId}</code>
            <span className="status-badge" style={{ borderColor: '#dfba68', color: '#dfba68' }}>
              <i style={{ width: 5, height: 5, borderRadius: '50%', background: '#dfba68', display: 'inline-block', marginRight: 6 }}></i>
              LIVE DATA
            </span>
          </div>
        </header>

        <div className="allocation-content">
          <div className="allocation-title">
            <div>
              <p className="eyebrow gold">SCENARIO / LIVE BACKEND DATA</p>
              <h1>Resource Allocation</h1>
              <p>Review available capacity, allocation coverage and operational shortages.</p>
            </div>
            <div>
              <button className="allocation-action" onClick={refreshStatus}>REFRESH ALLOCATIONS</button>
            </div>
          </div>

          <div className="allocation-summary">
            <div>
              <span>ALLOCATION HEALTH</span>
              <strong>{healthPct}%</strong>
              <p>Current coverage for the selected resource</p>
            </div>
            <div className="summary-bars">
              {resNames.map(name => {
                const r = rData[name]
                if (!r) return null
                const pct = r.required > 0 ? Math.round((r.allocated / r.required) * 100) : 100
                return (
                  <div key={name}>
                    <span>{name}</span>
                    <i>
                      <b className={pct < 100 ? 'short-fill' : ''} style={{ width: `${pct}%`, background: pct >= 100 ? '#83cbb4' : '#f47b7e' }}></b>
                    </i>
                    <strong>{pct}%</strong>
                  </div>
                )
              })}
            </div>
            <div className="summary-note"></div>
          </div>

          <div className="allocation-cards">
            {resNames.map(name => {
              const r = rData[name]
              if (!r) return null
              const pct = r.required > 0 ? Math.round((r.allocated / r.required) * 100) : 100
              const isShort = r.shortage > 0
              return (
                <button key={name} className={`allocation-card ${selected === name ? 'active' : ''}`} onClick={() => setSelected(name)}>
                  <div className="allocation-name">
                    <span><img src={icons[name]} alt="" />{name}</span>
                    <b className={isShort ? 'short' : 'healthy'}>{isShort ? 'SHORTAGE' : 'COVERED'}</b>
                  </div>
                  <div className="allocation-values">
                    <strong>{r.allocated.toLocaleString()}</strong>
                    <small>of {r.required.toLocaleString()} required</small>
                  </div>
                  <div className="allocation-bar">
                    <i style={{ width: `${pct}%`, background: pct >= 100 ? '#83cbb4' : '#f47b7e' }}></i>
                  </div>
                  <div className="allocation-meta">
                    <span>AVAILABLE<br/><b>{r.available.toLocaleString()}</b></span>
                    <span style={{textAlign: 'right'}}>SHORTAGE<br/><b className={isShort ? 'short' : 'healthy'}>{r.shortage.toLocaleString()}</b></span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="allocation-detail" style={{ marginTop: '20px', border: 'none', background: 'transparent' }}>
            <div className="resource-placeholder" style={{ background: '#102136', border: '1px solid #263a50', borderRadius: '15px' }}>
              <div>
                <p className="eyebrow gold">RESOURCE DETAIL</p>
                <h2 style={{ margin: '5px 0 15px', fontWeight: 700, fontSize: 20 }}>{selected} Allocation</h2>
                <p style={{ fontSize: 12, color: '#98abc0' }}>Live values returned by the Java simulation API.</p>
                <br/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={icons[selected]} alt="" style={{ width: 34, height: 34 }} />
                  <div>
                    <strong style={{ fontSize: 16 }}>{currentResource.allocated.toLocaleString()} allocated of {currentResource.required.toLocaleString()} required</strong>
                    <p style={{ marginTop: 7, color: '#98abc0', fontSize: 12 }}>{currentResource.available.toLocaleString()} available - {currentResource.shortage.toLocaleString()} remaining shortage.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="allocation-note">
            <img src={shield} alt="" />
            <div>
              <strong>Allocation status synchronized.</strong>
              <p>Coverage and shortages remain connected to the current backend response.</p>
            </div>
            <b style={{ color: currentResource.shortage > 0 ? '#f47b7e' : '#dfba68' }}>
              {currentResource.shortage > 0 ? `${currentResource.shortage.toLocaleString()} ${selected.toUpperCase()} SHORT` : 'FULLY ALLOCATED'}
            </b>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, fontSize: 10, color: '#718ba6', fontWeight: 600 }}>
            <span>EMERGENCY OPERATIONS / SIMULATION ENVIRONMENT</span>
            <span>Java API connected</span>
          </div>

        </div>
      </div>
    </main>
  )
}

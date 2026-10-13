import { useEffect, useState } from 'react'
import type { ElementType } from 'react'
import { LayoutDashboard, Settings, Map, Package, Activity, BarChart2, Radio, Info, Circle } from 'lucide-react'
import logo from '../assets/command-center/logo.png'
import { getBackendStatus } from '../api/simulationApi'

export type Screen = 'command-center' | 'configuration' | 'zones' | 'resources' | 'simulation' | 'live-operations' | 'results' | 'architecture'

const nav: { label: string; screen: Screen; icon: ElementType }[] = [
  { label: 'Dashboard', screen: 'command-center', icon: LayoutDashboard },
  { label: 'Disaster Setup', screen: 'configuration', icon: Settings },
  { label: 'Zones', screen: 'zones', icon: Map },
  { label: 'Resources', screen: 'resources', icon: Package },
  { label: 'Simulation', screen: 'simulation', icon: Activity },
  { label: 'Results', screen: 'results', icon: BarChart2 },
]

export function OperationsSidebar({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const [isOnline, setIsOnline] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    const checkPing = () => {
      getBackendStatus()
        .then(() => { if (mounted) setIsOnline(true) })
        .catch(() => { if (mounted) setIsOnline(false) })
    }
    checkPing()
    const intv = setInterval(checkPing, 5000)
    return () => { mounted = false; clearInterval(intv) }
  }, [])

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo"><img src={logo} alt="Logo" /></div>
        <strong>DISASTER<br />RESOURCE<br />SIMULATOR</strong>
      </div>
      <p className="sidebar-label">OPERATIONS WORKSPACE</p>
      <nav>
        {nav.map(n => (
          <button 
            key={n.screen} 
            className={`nav-item ${active === n.screen ? 'active' : ''}`} 
            onClick={() => onNavigate(n.screen)}
            aria-label={`Navigate to ${n.label}`}
          >
            <n.icon size={18} strokeWidth={2} />
            {n.label}
          </button>
        ))}
      </nav>
      <nav className="support-nav">
        <button className={`nav-item ${active === 'live-operations' ? 'active' : ''}`} onClick={() => onNavigate('live-operations')} aria-label="Live Operations">
          <Radio size={18} strokeWidth={2} /> Live Operations
        </button>
        <button className={`nav-item ${active === 'architecture' ? 'active' : ''}`} onClick={() => onNavigate('architecture')} aria-label="About / System Information">
          <Info size={18} strokeWidth={2} /> About / System Information
        </button>
      </nav>
      <div className="system-status">
        <p className="sidebar-label">SYSTEM STATUS</p>
        <span className={isOnline ? 'online' : 'offline'}>
          <Circle size={10} fill={isOnline ? '#83cbb4' : '#f47b7e'} stroke="none" />
          {isOnline ? 'Backend Ready' : 'Backend Offline'}
        </span>
        <small>{isOnline ? 'Java API connected' : 'Cannot reach API server'}</small>
      </div>
    </aside>
  )
}

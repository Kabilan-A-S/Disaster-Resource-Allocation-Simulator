import { useState } from 'react'
import './SystemArchitecture.css'
import './EmergencyCommandCenter.css'










import ready from '../assets/command-center/ready.svg'
import shield from '../assets/command-center/shield.svg'
import bell from '../assets/command-center/bell.svg'
import user from '../assets/command-center/user.svg'
import { architectureFlow, javaCapabilityGroups } from '../data/systemArchitecture'

import { OperationsSidebar, type Screen } from './OperationsSidebar'

export function SystemArchitecture({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [selected, setSelected] = useState(architectureFlow[0].name)
  const active = architectureFlow.find(layer => layer.name === selected)!
  return <main className="command-center architecture-screen"><OperationsSidebar active="architecture" onNavigate={onNavigate} /><div className="workspace"><header className="command-header"><div className="breadcrumb"><img src={shield} alt="" />SYSTEM <i>/</i><b>Architecture</b></div><div className="header-controls"><code>JAVA + REACT</code><span className="status-badge"><img src={ready} alt="" />ARCHITECTURE</span><em /><img src={bell} alt="Notifications" /><span className="user-circle"><img src={user} alt="User profile" /></span></div></header><div className="architecture-content"><div className="architecture-title"><div><p className="eyebrow gold">SYSTEM DESIGN / REFERENCE</p><h1>System Architecture</h1><p>How the command center interface connects to the planned Java simulation platform.</p></div><span><i /> DESIGN OVERVIEW</span></div><section className="architecture-map"><div className="architecture-head"><div><p className="eyebrow gold">APPLICATION FLOW</p><h2>Emergency Simulation Pipeline</h2></div><span>SELECT A LAYER TO INSPECT</span></div><div className="architecture-flow">{architectureFlow.map((layer, index) => <div className="flow-wrap" key={layer.name}><button onClick={() => setSelected(layer.name)} className={`architecture-node ${layer.kind} ${selected === layer.name ? 'selected' : ''}`}><span>0{index + 1}</span><strong>{layer.name}</strong><small>{layer.detail}</small></button>{index < architectureFlow.length - 1 && <i className="flow-arrow">↓</i>}</div>)}</div><div className="layer-inspector"><span>ACTIVE LAYER</span><strong>{active.name}</strong><p>{active.detail}</p><b>PLANNED COMPONENT</b></div></section><section className="architecture-grid"><section className="java-foundations"><div className="architecture-head"><div><p className="eyebrow gold">JAVA FOUNDATION</p><h2>Backend Design Concepts</h2><p>Core language features planned for the simulation backend.</p></div><span>JAVA SE</span></div><div className="capability-grid">{javaCapabilityGroups.map(group => <article key={group.title} className={group.accent}><div><i /> <strong>{group.title}</strong></div><ul>{group.items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div></section><section className="api-card"><div className="architecture-head"><div><p className="eyebrow gold">INTEGRATION LAYER</p><h2>Client ↔ Server API</h2></div><span>HTTP</span></div><div className="api-diagram"><div><b>React</b><small>fetch()</small></div><i>⇄</i><div><b>JDK HttpServer</b><small>REST-style endpoints</small></div></div><dl><div><dt>GET</dt><dd>/api/simulation/status</dd></div><div><dt>GET</dt><dd>/api/results</dd></div><div><dt>POST</dt><dd>/api/simulations</dd></div></dl><p><b>UI note:</b> Current screens use mock, API-shaped data. The Java service will later replace those model sources without changing presentation components.</p></section></section><section className="architecture-note"><img src={shield} alt="" /><div><strong>Planned technology boundary.</strong><p>React is responsible for visualization and user interactions. Java owns simulation models, allocations, persistence, concurrency and API responses.</p></div><b>NO SPRING BOOT · JDK HTTPSERVER</b></section></div><footer>EMERGENCY OPERATIONS / SIMULATION ENVIRONMENT <span>Java API connected</span></footer></div></main>
}

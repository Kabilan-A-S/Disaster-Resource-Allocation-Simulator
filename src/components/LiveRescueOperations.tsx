import { useMemo } from 'react'
import { useSimulationContext } from '../context/SimulationContext'
import { OperationsSidebar, type Screen } from './OperationsSidebar'
import './LiveRescueOperations.css'
import './EmergencyCommandCenter.css'

import ready from '../assets/command-center/ready.svg'
import shield from '../assets/command-center/shield.svg'
import bell from '../assets/command-center/bell.svg'
import user from '../assets/command-center/user.svg'
import teamIcon from '../assets/command-center/team.svg'

type RescueTeamState = 'AVAILABLE' | 'DEPLOYED' | 'WAITING' | 'COMPLETED'
type RescueTeam = { id: string; state: RescueTeamState; zone?: string; response: string }

const stateColors: Record<RescueTeamState, string> = { AVAILABLE: '#83cbb4', DEPLOYED: '#dfba68', WAITING: '#f47b7e', COMPLETED: '#83cbb4' }
const priorityColors: Record<string, string> = { CRITICAL: '#f47b7e', HIGH: '#eaa862', MEDIUM: '#dfba68', LOW: '#83cbb4' }

function TeamCard({ team }: { team: RescueTeam }) {
    const c = stateColors[team.state]
    return (
        <article className="team-card">
            <div>
                <span className="team-id"><img src={teamIcon} alt="" />{team.id}</span>
                <b style={{ color: c, background: `${c}16` }}><i style={{ background: c }} />{team.state}</b>
            </div>
            <strong>{team.zone ?? 'Command center'}</strong>
            <p>{team.state === 'AVAILABLE' ? 'Ready for dispatch' : team.state === 'WAITING' ? 'Awaiting capacity clearance' : `Response ETA ${team.response}`}</p>
        </article>
    )
}

export function LiveRescueOperations({ onNavigate }: { onNavigate: (s: Screen) => void }) {
    const { status, zones, scenario } = useSimulationContext()

    const { teams, activeEvents } = useMemo(() => {
        const tList: RescueTeam[] = []
        const eList: string[] = []
        
        let teamCounter = 1;
        
        if (status?.status === 'COMPLETED' || status?.status === 'RUNNING') {
            zones.forEach(z => {
                for (let i = 0; i < (z.teamsAssigned || 0); i++) {
                    const tid = `Team ${String(teamCounter++).padStart(2, '0')}`
                    tList.push({ id: tid, state: status.status === 'COMPLETED' ? 'COMPLETED' : 'DEPLOYED', zone: z.name, response: `${z.responseMinutes || 0} min` })
                    if (status.status === 'RUNNING') eList.push(`${tid} deployed to ${z.name}`)
                }
                const unassigned = ((z.teamsRequired || 0) || 0) - (z.teamsAssigned || 0);
                if (unassigned > 0 && status.status === 'RUNNING') {
                    eList.push(`${z.name} awaiting ${unassigned} teams`)
                }
            })
        }
        
        const totalTeams = scenario?.teams || 0;
        while (teamCounter <= totalTeams) {
            tList.push({ id: `Team ${String(teamCounter++).padStart(2, '0')}`, state: 'AVAILABLE', response: 'N/A' })
        }
        
        if (status?.status === 'COMPLETED') eList.unshift('All rescue operations successfully concluded.')

        return { teams: tList, activeEvents: eList }
    }, [zones, status, scenario])

    const deployed = teams.filter(t => t.state === 'DEPLOYED' || t.state === 'COMPLETED').length
    const available = teams.filter(t => t.state === 'AVAILABLE').length
    const active = teams.filter(t => t.state === 'DEPLOYED').length

    const requiredTotal = zones.reduce((sum, z) => sum + (z.teamsRequired || 0), 0)
    const shortage = Math.max(0, requiredTotal - (scenario?.teams || 0))

    return (
        <main className="command-center live-screen">
            <OperationsSidebar active="live-operations" onNavigate={onNavigate} />
            <div className="workspace">
                <header className="command-header">
                    <div className="breadcrumb"><img src={shield} alt="" />OPERATIONS <i>/</i><b>Live Rescue Operations</b></div>
                    <div className="header-controls">
                        <code>{scenario?.disaster?.toUpperCase() || 'SIMULATION'} / {status?.runId || 'N/A'}</code>
                        {status?.status === 'RUNNING' && <span className="status-badge"><img src={ready} alt="" />LIVE</span>}
                        <em />
                        <img src={bell} alt="Notifications" />
                        <span className="user-circle"><img src={user} alt="User profile" /></span>
                    </div>
                </header>
                <div className="live-content">
                    <div className="live-title">
                        <div>
                            <p className="eyebrow gold">LIVE OPERATIONS / {status?.runId || 'READY'}</p>
                            <h1>Live Rescue Operations</h1>
                            <p>Monitor real-time team availability, zone assignments and active rescue response.</p>
                        </div>
                        {status?.status === 'RUNNING' && <span><i /> LIVE FEED</span>}
                    </div>
                    <section className="live-metrics">
                        <article><p>AVAILABLE TEAMS</p><strong>{available}</strong><small>Ready for dispatch</small></article>
                        <article><p>ACTIVE / DEPLOYED</p><strong>{active}</strong><small>Maximum {scenario?.teams || 0} simultaneous</small></article>
                        <article><p>WAITING ZONES</p><strong>{zones.filter(z => (z.teamsRequired || 0) > (z.teamsAssigned || 0)).length}</strong><small>Awaiting team availability</small></article>
                        <article><p>TEAM SHORTAGE</p><strong>{shortage}</strong><small>{requiredTotal} required / {scenario?.teams || 0} available</small></article>
                    </section>
                    <section className="live-grid">
                        <div className="live-main">
                            <section className="zone-demand">
                                <div className="section-head">
                                    <div><p className="eyebrow gold">ZONE ASSIGNMENTS</p><h2>Rescue Demand by Zone</h2></div>
                                    <span>{deployed} DEPLOYED</span>
                                </div>
                                {zones.map(z => (
                                    <div className="demand-row" key={z.id}>
                                        <div><strong>{z.name}</strong><span style={{ color: priorityColors[z.priorityLevel] }}>{z.priorityLevel}</span></div>
                                        <div className="team-demand">
                                            <i>{Array.from({ length: (z.teamsRequired || 0) }).map((_, i) => <b key={i} className={i < (z.teamsAssigned || 0) ? 'assigned' : ''} />)}</i>
                                            <small>{z.teamsAssigned || 0} / {(z.teamsRequired || 0)} teams</small>
                                        </div>
                                        <em className={(z.teamsAssigned || 0) < (z.teamsRequired || 0) ? 'need' : ''}>
                                            {(z.teamsAssigned || 0) < (z.teamsRequired || 0) ? `${(z.teamsRequired || 0) - (z.teamsAssigned || 0)} teams short` : 'Active rescue'}
                                        </em>
                                    </div>
                                ))}
                            </section>
                            <section className="team-section">
                                <div className="section-head">
                                    <div><p className="eyebrow gold">TEAM POOL</p><h2>Rescue Team Status</h2></div>
                                    <span>{teams.length} TEAMS</span>
                                </div>
                                <div className="teams-grid">{teams.map(t => <TeamCard key={t.id} team={t} />)}</div>
                            </section>
                        </div>
                        <section className="activity-feed">
                            <div className="section-head">
                                <div><p className="eyebrow gold">ACTIVITY STREAM</p><h2>Live Activity</h2></div>
                                <span>UPDATING</span>
                            </div>
                            {activeEvents.map((event, i) => (
                                <div className="live-event" key={`${event}-${i}`}>
                                    <i />
                                    <div>
                                        <strong>{event}</strong>
                                        <p>Thread state synchronised</p>
                                    </div>
                                    <time>LIVE</time>
                                </div>
                            ))}
                        </section>
                    </section>
                </div>
            </div>
        </main>
    )
}

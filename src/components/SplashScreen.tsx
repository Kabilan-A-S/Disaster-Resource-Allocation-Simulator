import arrowRight from '../assets/arrow-right.svg'
import activationWave from '../assets/activation-wave.svg'
import disasterEmblem from '../assets/disaster-emblem.png'
import statusIndicator from '../assets/status-indicator.svg'
import '../App.css'

export function SplashScreen({ onStart }: { onStart: () => void }) {
  return <main className="splash-screen"><p className="environment-label">EMERGENCY OPERATIONS / SIMULATION ENVIRONMENT</p><section className="splash-content" aria-labelledby="system-title"><div className="emblem-surround" aria-hidden="true"><div className="emblem"><img src={disasterEmblem} alt="" /></div></div><h1 className="system-title" id="system-title">DISASTER RESOURCE<br />ALLOCATION SIMULATOR</h1><p className="system-promise">Emergency Response • Resource Optimization • Rescue Simulation</p><div className="opening-action"><button className="start-button" type="button" onClick={onStart}>START SIMULATION <img src={arrowRight} alt="" aria-hidden="true" /></button></div></section><p className="opening-footer"><img src={statusIndicator} alt="" aria-hidden="true" />Emergency Operations Simulation System</p><img className="activation-wave" src={activationWave} alt="" aria-hidden="true" /></main>
}

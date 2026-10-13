const API_BASE = 'http://127.0.0.1:8080/api'

export type BackendRunStatus = {
  runId: string
  status: 'IDLE' | 'STARTING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  state?: string
  stage?: string
  progress?: number
  currentHour?: number
  message?: string
  error?: string
}

export type BackendResource = {
  required: number
  available: number
  allocated: number
  shortage: number
}

export type BackendZone = {
  id: string
  name: string
  population: number
  severity: number
  medicalNeed: number
  distanceKm: number
  priorityScore: number
  priority: number
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  teamsRequired?: number
  teamsAssigned?: number
  travelMinutes?: number
  waitMinutes?: number
  responseMinutes?: number
  waterDemand?: number
  waterAllocated?: number
  waterShortage?: number
  foodDemand?: number
  foodAllocated?: number
  foodShortage?: number
  medicineDemand?: number
  medicineAllocated?: number
  medicineShortage?: number
  fuelDemand?: number
  fuelAllocated?: number
  fuelShortage?: number
}

export type BackendResult = {
  runId: string
  timestamp?: number
  status: 'COMPLETED' | string
  disaster?: string
  severity?: number
  duration?: number
  population?: number
  avgResponse?: number
  avgWait?: number
  resources: Record<string, BackendResource>
  teams: { required: number; available: number; peakAllocated: number; shortage: number }
  zones?: BackendZone[]
}

export type HistoryItem = {
  runId: string
  timestamp: number
  date?: string
  disaster: string
  severity: number
  duration: number
  zones?: number
  zonesCount?: number
  population: number
  waterCoverage?: number
  foodCoverage?: number
  medicineCoverage?: number
  fuelCoverage?: number
  teams: number
  avgResponse: number
  overallCoverage: number
  status: string
}

export type ZoneConfig = { name: string; population: number; severity: number; medicalNeed: number; distance: number }
export type ScenarioConfig = { disaster: string; severity: number; duration: number; population: number; zones: number; teams: number; water: number; food: number; medicine: number; fuel: number; zoneConfigs?: ZoneConfig[] }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(`${API_BASE}${path}`, init) }
  catch { throw new Error('Cannot reach the simulation server. Start the Java backend and try again.') }
  const text = await response.text()
  let body: unknown = null
  try { body = text ? JSON.parse(text) : null } catch { throw new Error('The simulation server returned an invalid response.') }
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : `Request failed (${response.status})`
    throw new Error(message)
  }
  return body as T
}

export function startSimulation(config: ScenarioConfig): Promise<BackendRunStatus> {
  const params = new URLSearchParams()
  params.append('disaster', config.disaster)
  params.append('disasterType', config.disaster)
  params.append('severity', String(config.severity))
  params.append('duration', String(config.duration))
  params.append('population', String(config.population))
  params.append('teams', String(config.teams))
  params.append('rescueTeams', String(config.teams))
  params.append('water', String(config.water))
  params.append('food', String(config.food))
  params.append('medicine', String(config.medicine))
  params.append('fuel', String(config.fuel))
  params.append('zones', String(config.zones))

  return request('/simulation/start', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
    body: params.toString() 
  })
}

export function resetSimulation(): Promise<void> {
  return Promise.resolve()
}

export function getBackendStatus(): Promise<BackendRunStatus> { return request('/simulation/status') }
export function getBackendResults(): Promise<BackendResult> { return request('/simulation/results') }
export function getZones(): Promise<BackendZone[]> { return request('/zones') }

export function addZone(zone: { zoneName: string; population: number; severity: number; medicalNeed: number; distanceKm: number }): Promise<BackendZone[]> {
  const params = new URLSearchParams()
  params.append('zoneName', zone.zoneName)
  params.append('population', String(zone.population))
  params.append('severity', String(zone.severity))
  params.append('medicalNeed', String(zone.medicalNeed))
  params.append('distanceKm', String(zone.distanceKm))
  return request('/zones/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
}

export function updateZone(zone: { zoneId: string; zoneName: string; population: number; severity: number; medicalNeed: number; distanceKm: number }): Promise<BackendZone[]> {
  const params = new URLSearchParams()
  params.append('zoneId', zone.zoneId)
  params.append('zoneName', zone.zoneName)
  params.append('population', String(zone.population))
  params.append('severity', String(zone.severity))
  params.append('medicalNeed', String(zone.medicalNeed))
  params.append('distanceKm', String(zone.distanceKm))
  return request('/zones/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
}

export function deleteZone(zoneId: string): Promise<BackendZone[]> {
  const params = new URLSearchParams()
  params.append('zoneId', zoneId)
  return request('/zones/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
}

export function resetZones(): Promise<BackendZone[]> {
  return request('/zones/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: ''
  })
}

export function getResources(): Promise<Record<string, BackendResource>> { return request('/resources') }
export function getHistory(): Promise<HistoryItem[]> { return request('/simulation/history') }

export function clearHistory(): Promise<void> {
  return request('/simulation/history/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: ''
  })
}

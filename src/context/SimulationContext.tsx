import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getBackendStatus, getBackendResults, getZones, getResources, getHistory, type BackendRunStatus, type BackendResult, type BackendZone, type BackendResource, type ScenarioConfig } from '../api/simulationApi';

export type SimulationContextType = {
    scenario: ScenarioConfig | null;
    setScenario: (config: ScenarioConfig) => void;
    status: BackendRunStatus & { progress?: number; message?: string } | null;
    results: (BackendResult & { avgResponse?: number; avgWait?: number }) | null;
    zones: BackendZone[];
    setZones: (zones: BackendZone[]) => void;
    resources: Record<string, BackendResource>;
    history: string[];
    loading: boolean;
    error: string;
    refreshStatus: () => void;
};

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children, initialScenario }: { children: ReactNode, initialScenario: ScenarioConfig }) {
    const [scenario, setScenario] = useState<ScenarioConfig | null>(initialScenario);
    const [status, setStatus] = useState<SimulationContextType['status']>(null);
    const [results, setResults] = useState<SimulationContextType['results']>(null);
    const [zones, setZones] = useState<BackendZone[]>([]);
    const [resources, setResources] = useState<Record<string, BackendResource>>({});
    const [history, setHistory] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [trigger, setTrigger] = useState(0);

    const refreshStatus = () => setTrigger(t => t + 1);

    useEffect(() => {
        let isMounted = true;
        const pollData = async () => {
            try {
                const stat = await getBackendStatus().catch(() => null);
                if (!stat) {
                    if (isMounted) {
                        setError('Cannot connect to simulation server');
                        setStatus(null);
                        setLoading(false);
                    }
                    return;
                }

                const [res, z, rData, hist] = await Promise.all([
                    getBackendResults().catch(() => null),
                    getZones().catch(() => []),
                    getResources().catch(() => ({})),
                    getHistory().catch(() => [])
                ]);

                if (!isMounted) return;
                setError('');

                let p = (stat as any)?.progress;
                let msg = (stat as any)?.stage || (stat as any)?.message;
                const effectiveStatus = (stat.status || (stat as any).state || 'IDLE');
                if (p === undefined || p === null) {
                    if (effectiveStatus === 'RUNNING') p = 50;
                    else if (effectiveStatus === 'COMPLETED') p = 100;
                    else p = 0;
                }
                if (!msg) {
                    if (effectiveStatus === 'RUNNING') msg = 'Running operations...';
                    else if (effectiveStatus === 'COMPLETED') msg = 'Simulation finished successfully.';
                    else msg = 'Configured and ready to begin.';
                }

                setStatus({ ...stat, status: effectiveStatus, progress: p, message: msg });
                setResults(res as any);
                setZones(z);
                setResources(rData);
                setHistory(hist as any);
                setLoading(false);
            } catch (e: any) {
                if (isMounted) {
                    setError(e.message || 'Error communicating with backend');
                    setLoading(false);
                }
            }
        };

        void pollData();
        const interval = window.setInterval(pollData, 1000);
        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [trigger]);

    return (
        <SimulationContext.Provider value={{ scenario, setScenario, status, results, zones, setZones, resources, history, loading, error, refreshStatus }}>
            {children}
        </SimulationContext.Provider>
    );
}

export function useSimulationContext() {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error('useSimulationContext must be used within a SimulationProvider');
    }
    return context;
}

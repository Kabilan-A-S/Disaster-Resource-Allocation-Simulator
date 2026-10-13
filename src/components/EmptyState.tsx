import { AlertCircle } from 'lucide-react';

export function EmptyState({ onConfigure }: { onConfigure: () => void }) {
  return (
    <div className="empty-state">
      <AlertCircle size={48} color="#718ba6" strokeWidth={1} />
      <h2>No simulation run yet</h2>
      <p>Configure a disaster scenario or start the engine to view live resource tracking and deployment priority.</p>
      <button className="btn-primary" onClick={onConfigure}>
        Configure Disaster
      </button>
    </div>
  );
}

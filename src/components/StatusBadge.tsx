export function StatusBadge({ status }: { status: 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string }) {
  const normStatus = status.toLowerCase() as 'ready' | 'running' | 'completed' | 'failed';
  return (
    <div className={`status-badge ${normStatus}`}>
      <span className="dot"></span>
      {status}
    </div>
  );
}

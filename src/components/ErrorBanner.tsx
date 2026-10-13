import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorBanner({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="error-banner">
      <p>
        <AlertTriangle size={20} />
        {message || 'Could not connect to the Java backend. Please ensure the server is running on localhost:8080.'}
      </p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', height: 36 }}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Retry
        </button>
      )}
    </div>
  );
}

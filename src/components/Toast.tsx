import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification ${type}`} role="status" aria-live="polite">
      {type === 'success' ? <CheckCircle size={18} color="#83cbb4" /> : <AlertCircle size={18} color="#f47b7e" />}
      <span>{message}</span>
      <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#98abc0', cursor: 'pointer', padding: 2, display: 'grid', placeItems: 'center' }}>
        <X size={14} />
      </button>
    </div>
  );
}

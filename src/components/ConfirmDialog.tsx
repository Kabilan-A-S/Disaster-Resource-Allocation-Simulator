import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-content confirm-modal">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: isDestructive ? 'rgba(244, 123, 126, 0.15)' : 'rgba(223, 186, 104, 0.15)',
            display: 'grid', placeItems: 'center',
            color: isDestructive ? '#f47b7e' : '#dfba68'
          }}>
            <AlertTriangle size={20} />
          </div>
          <h2 id="dialog-title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
        </div>
        <p style={{ color: '#98abc0', fontSize: 13, lineHeight: 1.5, margin: '0 0 24px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={isDestructive ? 'btn-danger' : 'btn-primary'}
            style={isDestructive ? { background: '#f47b7e', color: '#07111f', border: 'none', padding: '0 18px', height: 40, borderRadius: 8, fontWeight: 700 } : { height: 40 }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

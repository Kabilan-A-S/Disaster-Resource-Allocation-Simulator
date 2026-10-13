import type { ElementType, ReactNode } from 'react';

interface StatCardProps {
  icon: ElementType;
  label: string;
  value: ReactNode;
  text: ReactNode;
  colorClass?: string;
  trend?: string;
}

export function StatCard({ icon: Icon, label, value, text, colorClass = '', trend }: StatCardProps) {
  return (
    <article className="card stat-card" tabIndex={0}>
      <div className="stat-header">
        <h3 className="stat-title">{label}</h3>
        <div className={`stat-icon-chip ${colorClass}`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <strong className="stat-value">{value}</strong>
        <p className="stat-subtitle">
          {trend && <span className={trend.startsWith('+') ? 'text-success' : 'text-danger'}>{trend}</span>}
          {text}
        </p>
      </div>
    </article>
  );
}

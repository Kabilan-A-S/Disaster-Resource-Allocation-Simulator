import type { ElementType } from 'react';

interface ResourceCardProps {
  icon: ElementType;
  name: string;
  available: number;
  required: number;
  unit?: string;
}

export function ResourceCard({ icon: Icon, name, available, required, unit = '' }: ResourceCardProps) {
  const rawPct = required > 0 ? (available / required) * 100 : 100;
  const cappedPct = Math.min(100, Math.max(0, rawPct));
  const displayPct = cappedPct % 1 === 0 ? cappedPct.toFixed(0) : cappedPct.toFixed(1);
  const shortage = Math.max(0, required - available);
  
  let statusClass = 'success';
  if (cappedPct < 60) statusClass = 'danger';
  else if (cappedPct < 100) statusClass = 'warning';

  const unitSuffix = unit ? ` ${unit}` : '';

  return (
    <article className="card resource-card" tabIndex={0} aria-label={`${name} resource: ${displayPct}% coverage`}>
      <div className="resource-header">
        <div className="resource-name">
          <Icon size={18} className={`text-${statusClass}`} />
          {name}
        </div>
        <div className={`resource-badge ${statusClass}`}>
          {displayPct}%
        </div>
      </div>
      
      <div className="resource-progress-bg">
        <div 
          className={`resource-progress-fill ${statusClass}`} 
          style={{ width: `${cappedPct}%` }}
        />
      </div>
      
      <div className="resource-details">
        <div className="resource-values">
          <span>Available <strong>{available.toLocaleString()}{unitSuffix}</strong></span>
          <span style={{ margin: '0 4px', color: 'var(--text-dim)' }}>/</span>
          <span>Required <strong>{required.toLocaleString()}{unitSuffix}</strong></span>
        </div>
        {shortage > 0 && (
          <div className="resource-shortage">
            Shortage {shortage.toLocaleString()}{unitSuffix}
          </div>
        )}
      </div>
    </article>
  );
}

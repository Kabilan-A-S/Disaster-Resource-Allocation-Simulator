interface SegmentedSelectProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  labels?: Record<number, string>;
}

const DEFAULT_LABELS: Record<number, string> = {
  1: '1 Minor',
  2: '2 Moderate',
  3: '3 Serious',
  4: '4 Severe',
  5: '5 Critical'
};

const RAMP_COLORS: Record<number, string> = {
  1: '#83cbb4', // Green
  2: '#9dd192', // Light green
  3: '#dfba68', // Yellow/Amber
  4: '#eaa862', // Orange
  5: '#f47b7e'  // Red
};

export function SegmentedSelect({
  value,
  onChange,
  label,
  labels = DEFAULT_LABELS
}: SegmentedSelectProps) {
  return (
    <div className="segmented-selector-wrap">
      {label && <span className="field-label">{label}</span>}
      <div className="segmented-buttons-row" role="radiogroup" aria-label={label || 'Select level'}>
        {[1, 2, 3, 4, 5].map(lvl => {
          const isSelected = value === lvl;
          const color = RAMP_COLORS[lvl];
          return (
            <button
              key={lvl}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(lvl)}
              className={`segmented-button ${isSelected ? 'active' : ''}`}
              style={isSelected ? { borderColor: color, color: '#07111f', background: color, fontWeight: 700 } : {}}
            >
              {lvl}
            </button>
          );
        })}
      </div>
      <p className="segmented-hint" style={{ color: RAMP_COLORS[value] || '#98abc0' }}>
        {labels[value] || `Level ${value}`}
      </p>
    </div>
  );
}

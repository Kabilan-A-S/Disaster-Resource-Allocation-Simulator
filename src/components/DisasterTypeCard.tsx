import type { ElementType } from 'react';

interface DisasterTypeCardProps {
  id: string;
  name: string;
  description: string;
  baseFactor: number;
  icon: ElementType;
  isSelected: boolean;
  onSelect: () => void;
}

export function DisasterTypeCard({
  name,
  description,
  baseFactor,
  icon: Icon,
  isSelected,
  onSelect
}: DisasterTypeCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={`disaster-type-card ${isSelected ? 'selected' : ''}`}
    >
      <div className="dtc-header">
        <div className="dtc-icon">
          <Icon size={22} />
        </div>
        <span className="dtc-factor">{baseFactor}% base impact</span>
      </div>
      <strong className="dtc-name">{name}</strong>
      <p className="dtc-desc">{description}</p>
    </button>
  );
}

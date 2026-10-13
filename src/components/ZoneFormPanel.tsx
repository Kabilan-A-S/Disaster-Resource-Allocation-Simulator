import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { SegmentedSelect } from './SegmentedSelect';
import { LevelBadge } from './LevelBadge';
import { addZone, updateZone, type BackendZone } from '../api/simulationApi';

interface ZoneFormPanelProps {
  isOpen: boolean;
  zone: BackendZone | null; // null for add, non-null for edit
  onClose: () => void;
  onSuccess: (zones: BackendZone[], msg: string) => void;
}

export function ZoneFormPanel({ isOpen, zone, onClose, onSuccess }: ZoneFormPanelProps) {
  const [name, setName] = useState('');
  const [population, setPopulation] = useState<number | ''>(10000);
  const [severity, setSeverity] = useState(3);
  const [medicalNeed, setMedicalNeed] = useState(3);
  const [distanceKm, setDistanceKm] = useState<number | ''>(15);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setPopulation(zone.population);
      setSeverity(zone.severity || 3);
      setMedicalNeed(zone.medicalNeed || 3);
      setDistanceKm(zone.distanceKm || 15);
    } else {
      setName('');
      setPopulation(10000);
      setSeverity(3);
      setMedicalNeed(3);
      setDistanceKm(15);
    }
    setError('');
  }, [zone, isOpen]);

  if (!isOpen) return null;

  // Validation
  const numPop = typeof population === 'number' ? population : 0;
  const numDist = typeof distanceKm === 'number' ? distanceKm : 0;

  const nameError = !name.trim() ? 'Zone name cannot be empty' : '';
  const popError = numPop <= 0 ? 'Population must be greater than 0' : '';
  const distError = numDist <= 0 ? 'Distance must be greater than 0' : '';
  const sevError = (severity < 1 || severity > 5) ? 'Severity must be between 1 and 5' : '';
  const medError = (medicalNeed < 1 || medicalNeed > 5) ? 'Medical need must be between 1 and 5' : '';

  const isValid = !nameError && !popError && !distError && !sevError && !medError;

  // Live preview
  const liveScore = Math.max(0, numPop) * severity * medicalNeed;
  let liveLevel = 'LOW';
  if (liveScore >= 100000) liveLevel = 'CRITICAL';
  else if (liveScore >= 50000) liveLevel = 'HIGH';
  else if (liveScore >= 20000) liveLevel = 'MEDIUM';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;

    setSaving(true);
    setError('');
    try {
      let updated: BackendZone[];
      if (zone) {
        updated = await updateZone({
          zoneId: zone.id,
          zoneName: name.trim(),
          population: numPop,
          severity,
          medicalNeed,
          distanceKm: numDist
        });
        onSuccess(updated, `${name.trim()} updated successfully`);
      } else {
        updated = await addZone({
          zoneName: name.trim(),
          population: numPop,
          severity,
          medicalNeed,
          distanceKm: numDist
        });
        onSuccess(updated, `${name.trim()} added successfully`);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="slideover-backdrop" role="dialog" aria-modal="true" aria-labelledby="slideover-title">
      <div className="slideover-panel">
        <div className="slideover-header">
          <div>
            <p className="eyebrow gold">{zone ? 'EDIT ZONE' : 'NEW ZONE CONFIGURATION'}</p>
            <h2 id="slideover-title">{zone ? `Edit ${zone.name}` : 'Add New Zone'}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close panel">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="slideover-form">
          <div className="form-field">
            <label htmlFor="zone-name">ZONE NAME</label>
            <input
              id="zone-name"
              type="text"
              placeholder="e.g. Zone F"
              value={name}
              onChange={e => setName(e.target.value)}
              className={nameError && name ? 'input-error' : ''}
              autoFocus
            />
            {nameError && <span className="field-error-text">{nameError}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="zone-pop">POPULATION</label>
            <input
              id="zone-pop"
              type="number"
              min="1"
              value={population}
              onChange={e => setPopulation(e.target.value === '' ? '' : Number(e.target.value))}
              className={popError ? 'input-error' : ''}
            />
            {popError && <span className="field-error-text">{popError}</span>}
          </div>

          <SegmentedSelect
            label="SEVERITY (1-5)"
            value={severity}
            onChange={setSeverity}
          />
          {sevError && <span className="field-error-text">{sevError}</span>}

          <SegmentedSelect
            label="MEDICAL NEED (1-5)"
            value={medicalNeed}
            onChange={setMedicalNeed}
            labels={{
              1: '1 Minimal trauma / Basic first aid',
              2: '2 Moderate trauma / Clinic triage',
              3: '3 High trauma / Field hospital needed',
              4: '4 Severe casualties / ICU beds needed',
              5: '5 Critical mass casualty emergency'
            }}
          />
          {medError && <span className="field-error-text">{medError}</span>}

          <div className="form-field">
            <label htmlFor="zone-dist">DISTANCE FROM BASE (KM)</label>
            <input
              id="zone-dist"
              type="number"
              min="1"
              value={distanceKm}
              onChange={e => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))}
              className={distError ? 'input-error' : ''}
            />
            {distError && <span className="field-error-text">{distError}</span>}
          </div>

          {/* Live Preview Card */}
          <div className="preview-calc-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="eyebrow" style={{ fontSize: 10 }}>COMPUTED PRIORITY PREVIEW</span>
              <LevelBadge level={liveLevel} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
              <strong style={{ font: "700 28px 'Space Grotesk', sans-serif", color: '#edf2f7' }}>
                {liveScore.toLocaleString()}
              </strong>
              <small style={{ color: '#718ba6', fontSize: 11 }}>
                ({numPop.toLocaleString()} pop × {severity} sev × {medicalNeed} med)
              </small>
            </div>
          </div>

          <div className="slideover-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!isValid || saving}>
              {saving ? (
                <>
                  <Loader2 size={16} className="spinner" /> Saving...
                </>
              ) : zone ? 'Save Changes' : '+ Add Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

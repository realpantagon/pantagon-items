import type { SelectHTMLAttributes } from 'react';
import { cn } from '../utils/helpers';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined);

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          className="hud-label"
          style={{ display: 'block', marginBottom: '6px' }}
        >
          {label}
        </label>
      )}
      <div className="ui-field-shell">
        <div className="ui-field-rail" style={{ background: error ? 'var(--soft-red)' : 'var(--accent)' }} />
        <select
          id={selectId}
          className={cn('ui-select', className)}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <div
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--accent)' }}
        >
          <svg width="10" height="6" fill="none" viewBox="0 0 10 6">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="ui-error">{error}</p>
      )}
    </div>
  );
}

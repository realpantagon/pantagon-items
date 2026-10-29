import type { SelectHTMLAttributes } from 'react';
import { cn } from '../utils/helpers';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className, id, name, ...props }: SelectProps) {
  const selectId = id || name;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label htmlFor={selectId} className="ui-field-label">
          {label}
        </label>
      )}
      <div className="ui-field-shell" data-invalid={error ? 'true' : undefined}>
        <select
          id={selectId}
          name={name}
          className={cn('ui-select', className)}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div
          aria-hidden="true"
          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }}
        >
          <svg width="12" height="8" fill="none" viewBox="0 0 12 8">
            <path d="M1 1.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {error && <p className="ui-error">{error}</p>}
    </div>
  );
}

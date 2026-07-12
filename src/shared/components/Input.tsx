import type { InputHTMLAttributes } from 'react';
import { cn } from '../utils/helpers';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined);

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          className="hud-label"
          style={{ display: 'block', marginBottom: '6px' }}
        >
          {label}
        </label>
      )}
      <div className="ui-field-shell">
        <div className="ui-field-rail" style={{ background: error ? 'var(--soft-red)' : 'var(--accent)' }} />
        <input
          id={inputId}
          className={cn('ui-input', className)}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
      </div>
      {error && (
        <p className="ui-error">{error}</p>
      )}
    </div>
  );
}

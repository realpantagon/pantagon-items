import type { InputHTMLAttributes } from 'react';
import { cn } from '../utils/helpers';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: string;
}

export default function Input({ label, error, suffix, className, id, name, ...props }: InputProps) {
  const inputId = id || name;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label htmlFor={inputId} className="ui-field-label">
          {label}
        </label>
      )}
      <div className="ui-field-shell" data-invalid={error ? 'true' : undefined}>
        <input
          id={inputId}
          name={name}
          className={cn('ui-input', className)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {suffix && (
          <span style={{ display: 'flex', alignItems: 'center', paddingRight: '0.9rem', color: 'var(--text-dim)' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="ui-error">{error}</p>
      )}
    </div>
  );
}

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
      <div style={{ position: 'relative' }}>
        {/* Left accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '2px',
            background: error ? 'var(--soft-red)' : 'rgba(255,43,43,0.4)',
          }}
        />
        <input
          id={inputId}
          className={cn(className)}
          style={{
            width: '100%',
            paddingLeft: '14px',
            paddingRight: '12px',
            paddingTop: '10px',
            paddingBottom: '10px',
            background: 'rgba(8,8,8,0.9)',
            border: `1px solid ${error ? 'rgba(255,90,90,0.5)' : 'rgba(255,43,43,0.15)'}`,
            borderLeft: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-tech)',
            fontSize: '14px',
            letterSpacing: '0.04em',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            borderRadius: '0 2px 2px 0',
          }}
          onFocus={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,43,43,0.5)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(255,43,43,0.2), 0 0 16px rgba(255,43,43,0.1)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(12,12,12,0.95)';
          }}
          onBlur={e => {
            (e.currentTarget as HTMLElement).style.borderColor = error ? 'rgba(255,90,90,0.5)' : 'rgba(255,43,43,0.15)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLElement).style.background = 'rgba(8,8,8,0.9)';
          }}
          {...props}
        />
      </div>
      {error && (
        <p
          className="font-display"
          style={{
            marginTop: '4px',
            fontSize: '9px',
            letterSpacing: '0.1em',
            color: 'var(--soft-red)',
          }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

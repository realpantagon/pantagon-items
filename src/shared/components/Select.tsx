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
      <div style={{ position: 'relative' }}>
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
        <select
          id={selectId}
          className={cn(className)}
          style={{
            width: '100%',
            paddingLeft: '14px',
            paddingRight: '36px',
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
            appearance: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            borderRadius: '0 2px 2px 0',
          }}
          onFocus={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,43,43,0.5)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(255,43,43,0.2)';
          }}
          onBlur={e => {
            (e.currentTarget as HTMLElement).style.borderColor = error ? 'rgba(255,90,90,0.5)' : 'rgba(255,43,43,0.15)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
          {...props}
        >
          {options.map(option => (
            <option
              key={option.value}
              value={option.value}
              style={{ background: '#0D0D0D', color: 'var(--text-primary)' }}
            >
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--neon-red)',
          }}
        >
          <svg width="10" height="6" fill="none" viewBox="0 0 10 6">
            <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </div>
      </div>
      {error && (
        <p
          className="font-display"
          style={{ marginTop: '4px', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--soft-red)' }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

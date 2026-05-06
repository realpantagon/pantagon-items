import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const styles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'rgba(255,43,43,0.1)',
    border: '1px solid var(--neon-red)',
    color: 'var(--neon-red)',
    boxShadow: '0 0 12px rgba(255,43,43,0.25), inset 0 0 12px rgba(255,43,43,0.05)',
  },
  secondary: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--text-secondary)',
    boxShadow: 'none',
  },
  danger: {
    background: 'rgba(255,43,43,0.12)',
    border: '1px solid rgba(255,43,43,0.4)',
    color: 'var(--soft-red)',
    boxShadow: '0 0 8px rgba(255,43,43,0.2)',
  },
  ghost: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
    boxShadow: 'none',
  },
};

const hoverStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'rgba(255,43,43,0.2)',
    boxShadow: '0 0 20px rgba(255,43,43,0.45), inset 0 0 16px rgba(255,43,43,0.1)',
  },
  secondary: {
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-primary)',
  },
  danger: {
    background: 'rgba(255,43,43,0.2)',
    boxShadow: '0 0 16px rgba(255,43,43,0.35)',
  },
  ghost: {
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
  },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: '10px', letterSpacing: '0.14em' },
  md: { padding: '9px 18px', fontSize: '11px', letterSpacing: '0.14em' },
  lg: { padding: '12px 24px', fontSize: '12px', letterSpacing: '0.14em' },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  disabled,
  ...props
}: ButtonProps) {
  const variantStyle = styles[variant];
  const hoverStyle = hoverStyles[variant];
  const sizeStyle = sizes[size];

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    textTransform: 'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.2s ease',
    outline: 'none',
    borderRadius: '2px',
    gap: '6px',
    whiteSpace: 'nowrap',
    ...variantStyle,
    ...sizeStyle,
    ...style,
  };

  return (
    <button
      className={cn(className)}
      style={baseStyle}
      disabled={disabled}
      onMouseEnter={e => {
        if (!disabled) {
          Object.assign((e.currentTarget as HTMLElement).style, hoverStyle);
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        if (!disabled) {
          Object.assign((e.currentTarget as HTMLElement).style, variantStyle);
        }
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

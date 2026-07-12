import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'ui-button--sm',
  md: 'ui-button--md',
  lg: 'ui-button--lg',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = `ui-button--${variant}`;
  const sizeClass = sizes[size];

  return (
    <button
      className={cn('ui-button', variantClass, sizeClass, className)}
      style={style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

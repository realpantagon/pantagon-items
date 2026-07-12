import type { ReactNode } from 'react';
import { cn } from '../utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function Card({ children, className, style }: CardProps) {
  return (
    <div
      className={cn('ui-card', className)}
      style={style}
    >
      {children}
    </div>
  );
}

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
      className={cn('holo-card corner-bracket', className)}
      style={{
        padding: '20px',
        borderRadius: '2px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

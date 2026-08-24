import { useState } from 'react';

interface StarRatingProps {
  value: number | null;
  onChange?: (value: number) => void;
  max?: number;
  size?: number;
  readOnly?: boolean;
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? '#facc15' : 'none'}
      stroke={filled ? '#facc15' : 'var(--text-dim)'}
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <path d="M12 3.5l2.6 5.34 5.9.86-4.27 4.16 1.01 5.88L12 16.9l-5.24 2.84 1.01-5.88L3.5 9.7l5.9-.86L12 3.5z" />
    </svg>
  );
}

export default function StarRating({ value, onChange, max = 5, size = 20, readOnly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = !readOnly && !!onChange;
  const displayValue = hovered ?? value ?? 0;

  return (
    <div
      style={{ display: 'inline-flex', gap: '3px' }}
      onMouseLeave={() => interactive && setHovered(null)}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          aria-label={`Rate ${star} out of ${max}`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            lineHeight: 0,
            cursor: interactive ? 'pointer' : 'default',
          }}
        >
          <Star filled={star <= displayValue} size={size} />
        </button>
      ))}
    </div>
  );
}

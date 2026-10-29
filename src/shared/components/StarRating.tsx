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
      fill={filled ? 'var(--star)' : 'none'}
      stroke={filled ? 'var(--star)' : 'var(--text-dim)'}
      strokeWidth={1.5}
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5l2.6 5.34 5.9.86-4.27 4.16 1.01 5.88L12 16.9l-5.24 2.84 1.01-5.88L3.5 9.7l5.9-.86L12 3.5z" />
    </svg>
  );
}

export default function StarRating({ value, onChange, max = 5, size = 20, readOnly = false }: StarRatingProps) {
  const interactive = !readOnly && !!onChange;
  const current = value ?? 0;

  if (!interactive) {
    return (
      <span role="img" aria-label={value ? `Rated ${value} of ${max}` : 'Not rated'} style={{ display: 'inline-flex', gap: '2px' }}>
        {Array.from({ length: max }, (_, i) => <Star key={i} filled={i < current} size={size} />)}
      </span>
    );
  }

  // Each star gets a 44pt tap target even though the artwork is smaller
  return (
    <div role="radiogroup" aria-label="Rating" style={{ display: 'inline-flex', margin: '0 -10px' }}>
      {Array.from({ length: max }, (_, i) => i + 1).map(star => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={star === value}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          onClick={() => onChange?.(star)}
          className="pressable"
          style={{
            width: '44px',
            height: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          <Star filled={star <= current} size={size} />
        </button>
      ))}
    </div>
  );
}

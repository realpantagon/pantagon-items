import { cn } from '../utils/helpers';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'ui-button ui-button--sm',
        active
          ? 'ui-button--primary'
          : 'ui-button--secondary'
      )}
    >
      {label}
    </button>
  );
}

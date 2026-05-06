import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../../api/items/calculations';
import type { PantagonItem } from '../../../api/items/types';

interface ItemCardProps {
  item: PantagonItem;
  dailyBurn: number;
}

export default function ItemCard({ item, dailyBurn }: ItemCardProps) {
  const navigate = useNavigate();
  const isOwned = item.status === 'owned';

  return (
    <div
      onClick={() => navigate(`/${item.id}`)}
      style={{
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,43,43,0.12)',
        borderLeft: '2px solid rgba(255,43,43,0.5)',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(255,43,43,0.05)';
        el.style.borderColor = 'rgba(255,43,43,0.35)';
        el.style.borderLeftColor = 'var(--neon-red)';
        el.style.boxShadow = '0 0 20px rgba(255,43,43,0.1), inset 0 0 20px rgba(255,43,43,0.03)';
        el.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = 'rgba(10,10,10,0.85)';
        el.style.borderColor = 'rgba(255,43,43,0.12)';
        el.style.borderLeftColor = 'rgba(255,43,43,0.5)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateX(0)';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        {/* Left: name + tags */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="font-ui"
            style={{
              margin: '0 0 5px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </h3>
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {item.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="font-display"
                  style={{
                    fontSize: '7px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '1px 5px',
                    background: 'rgba(255,43,43,0.06)',
                    border: '1px solid rgba(255,43,43,0.18)',
                    color: 'rgba(255,90,90,0.7)',
                  }}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span
                  className="font-display"
                  style={{ fontSize: '7px', letterSpacing: '0.1em', color: 'var(--text-dim)', padding: '1px 3px' }}
                >
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: price + status */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            className="font-tech"
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.03em',
            }}
          >
            {formatCurrency(item.buy_price)}
          </div>
          <div style={{ marginTop: '4px' }}>
            {isOwned ? (
              <span className="badge-owned">OWNED</span>
            ) : (
              <span className="badge-sold">SOLD</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '9px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOwned && item.daily_burn && (
            <>
              <div style={{ position: 'relative', width: '5px', height: '5px' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'var(--neon-red)',
                    animation: 'status-ping 2s ease-in-out infinite',
                    opacity: 0.4,
                  }}
                />
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--neon-red)', boxShadow: '0 0 4px var(--neon-red)' }} />
              </div>
              <span
                className="font-display"
                style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'var(--soft-red)' }}
              >
                {formatCurrency(dailyBurn)}<span style={{ color: 'var(--text-dim)' }}>/day</span>
              </span>
            </>
          )}
        </div>

        <div
          className="font-tech"
          style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.04em' }}
        >
          {item.status === 'sold' && item.sell_date
            ? `SOLD ${format(new Date(item.sell_date), 'MMM d, yyyy').toUpperCase()}`
            : `ACQ ${format(new Date(item.buy_date), 'MMM d, yyyy').toUpperCase()}`
          }
        </div>
      </div>

      {/* Right chevron indicator */}
      <div
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(255,43,43,0.2)',
          pointerEvents: 'none',
        }}
      >
        <svg width="8" height="12" fill="none" viewBox="0 0 8 12">
          <path d="M1 1l6 5-6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      </div>
    </div>
  );
}

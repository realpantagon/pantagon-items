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
      className="ui-card"
      style={{
        padding: '0.95rem 1rem',
        cursor: 'pointer',
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease',
        position: 'relative',
        overflow: 'hidden',
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
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--accent-strong)',
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
              <span className="badge-owned">Owned</span>
            ) : (
              <span className="badge-sold">Sold</span>
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
          borderTop: '1px solid var(--border-subtle)',
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
                    background: 'var(--accent)',
                    opacity: 0.35,
                  }}
                />
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }} />
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

    </div>
  );
}

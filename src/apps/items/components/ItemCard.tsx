import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { calculateDaysHeld, calculateProfit, formatCurrency } from '../../../api/items/calculations';
import type { PantagonItem } from '../../../api/items/types';
import { tagChipStyle } from '../utils/tagColor';

interface ItemCardProps {
  item: PantagonItem;
  dailyBurn: number;
}

export default function ItemCard({ item, dailyBurn }: ItemCardProps) {
  const navigate = useNavigate();
  const isOwned = item.status === 'owned';

  const daysHeld = calculateDaysHeld(item.buy_date, item.sell_date);
  const profit = !isOwned && item.sell_price != null ? calculateProfit(item.sell_price, item.buy_price) : null;
  const isGain = (profit ?? 0) >= 0;
  const pnlColor = isGain ? 'var(--gain)' : 'var(--loss)';
  const pnlSign = isGain ? '+' : '−';

  return (
    <div
      onClick={() => navigate(`/${item.id}`)}
      className="ui-card"
      style={{
        padding: '1rem 1.02rem',
        cursor: 'pointer',
        transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: `3px solid ${
          isOwned
            ? 'color-mix(in srgb, var(--accent) 78%, transparent)'
            : profit === null || !isGain
              ? 'var(--border-subtle)'
              : `color-mix(in srgb, ${pnlColor} 55%, transparent)`
        }`,
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
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.01em',
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
                  className="tag-chip"
                  style={{
                    ...tagChipStyle(tag),
                    fontSize: '0.68rem',
                    letterSpacing: '0.01em',
                    padding: '2px 8px',
                    fontWeight: 600,
                  }}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span
                  className="font-display"
                  style={{ fontSize: '0.68rem', letterSpacing: '0.01em', color: 'var(--text-dim)', padding: '2px 3px' }}
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
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '0.01em',
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
          marginTop: '11px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
          rowGap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {profit !== null && (
            <>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: pnlColor,
                  background: isGain ? `color-mix(in srgb, ${pnlColor} 14%, transparent)` : 'transparent',
                  border: `1px solid color-mix(in srgb, ${pnlColor} ${isGain ? 30 : 22}%, transparent)`,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                {pnlSign}{formatCurrency(Math.abs(profit), 0)}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                {daysHeld}d
                <span style={{ color: isGain ? pnlColor : 'var(--text-dim)', opacity: 0.9, marginLeft: '5px' }}>
                  {pnlSign}{formatCurrency(Math.abs(profit / daysHeld))}/day
                </span>
              </span>
            </>
          )}
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
                style={{ fontSize: '0.78rem', letterSpacing: '0.01em', color: 'var(--soft-red)' }}
              >
                {formatCurrency(dailyBurn)}<span style={{ color: 'var(--text-dim)' }}>/day</span>
              </span>
            </>
          )}
        </div>

        <div
          className="font-tech"
          style={{
            fontSize: '0.7rem',
            color: 'var(--text-dim)',
            letterSpacing: '0.02em',
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            justifyContent: 'end',
            columnGap: '6px',
            rowGap: '2px',
            textAlign: 'right',
          }}
        >
          <span style={{ opacity: 0.7 }}>ACQ</span>
          <span>{format(new Date(item.buy_date), 'MMM d, yyyy').toUpperCase()}</span>
          {item.status === 'sold' && item.sell_date && (
            <>
              <span style={{ opacity: 0.7 }}>SOLD</span>
              <span>{format(new Date(item.sell_date), 'MMM d, yyyy').toUpperCase()}</span>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

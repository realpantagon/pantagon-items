import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { calculateDaysHeld, calculateProfit, calculateRealCost, formatCurrency } from '../../../api/items/calculations';
import type { PantagonItem } from '../../../api/items/types';
import StarRating from '../../../shared/components/StarRating';
import { tagChipStyle } from '../utils/tagColor';

interface ItemCardProps {
  item: PantagonItem;
  dailyBurn: number;
}

export default function ItemCard({ item, dailyBurn }: ItemCardProps) {
  const isOwned = item.status === 'owned';

  const daysHeld = calculateDaysHeld(item.buy_date, item.sell_date);
  const realCost = calculateRealCost(item.buy_price, item.extra_cost);
  const profit = !isOwned && item.sell_price != null ? calculateProfit(item.sell_price, realCost) : null;
  const isGain = (profit ?? 0) >= 0;
  const pnlColor = isGain ? 'var(--gain)' : 'var(--loss)';
  const pnlSign = isGain ? '+' : '−';

  return (
    <Link
      to={`/${item.id}`}
      className="ui-card pressable"
      style={{ display: 'block', padding: '14px 16px', textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 600,
              lineHeight: 1.35,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </h3>
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
              {item.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="tag-chip"
                  style={{ ...tagChipStyle(tag), fontSize: '0.74rem', padding: '2px 8px', fontWeight: 600 }}
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', padding: '2px 3px' }}>
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}
          {item.rating != null && (
            <div style={{ marginTop: '7px', lineHeight: 0 }}>
              <StarRating value={item.rating} readOnly size={13} />
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="num" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
            {formatCurrency(item.buy_price, item.buy_price % 1 === 0 ? 0 : 2)}
          </div>
          <div style={{ marginTop: '6px' }}>
            <span className={isOwned ? 'badge-owned' : 'badge-sold'}>{isOwned ? 'Owned' : 'Sold'}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.84rem',
        }}
      >
        <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {profit !== null && (
            <>
              <span
                style={{
                  fontWeight: 700,
                  color: pnlColor,
                  background: `color-mix(in srgb, ${pnlColor} 14%, transparent)`,
                  padding: '2px 9px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                {pnlSign}{formatCurrency(Math.abs(profit), 0)}
              </span>
              <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>held {daysHeld}d</span>
            </>
          )}
          {isOwned && item.daily_burn && (
            <span style={{ color: 'var(--soft-red)', whiteSpace: 'nowrap' }}>
              {formatCurrency(dailyBurn)}
              <span style={{ color: 'var(--text-dim)' }}>/day</span>
            </span>
          )}
          {isOwned && !item.daily_burn && (
            <span style={{ color: 'var(--text-dim)' }}>{daysHeld} days</span>
          )}
        </div>

        <div className="num" style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
          {format(new Date(item.sell_date ?? item.buy_date), 'd MMM yyyy')}
          {!isOwned && item.sell_date && <span style={{ marginLeft: '4px' }}>sold</span>}
        </div>
      </div>
    </Link>
  );
}

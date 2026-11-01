import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { deleteItem, fetchItemById, getCachedItem, updateItem } from '../../../api/items/api';
import type { PantagonItem } from '../../../api/items/types';
import { enrichItemWithMetrics, formatCurrency } from '../../../api/items/calculations';
import { tagChipStyle } from '../utils/tagColor';
import ActionBar from '../../../shared/components/ActionBar';
import Button from '../../../shared/components/Button';
import Sheet from '../../../shared/components/Sheet';
import StarRating from '../../../shared/components/StarRating';
import {
  parseExtraCostDetails,
  parseLegacyExtraCostsFromNote,
  stripLegacyExtraCostsFromNote,
} from '../utils/extraCostDetails';

function Row({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="row">
      <span className="row__label">{label}</span>
      <span className="row__value num" style={color ? { color, fontWeight: 700 } : undefined}>{value}</span>
    </div>
  );
}

const fmtDate = (value: string) => format(parseISO(value), 'd MMM yyyy');

function warrantyText(expires: string) {
  const days = differenceInCalendarDays(parseISO(expires), new Date());
  if (days < 0) return { text: `${fmtDate(expires)} · expired`, color: 'var(--text-dim)' };
  if (days <= 30) return { text: `${fmtDate(expires)} · ${days}d left`, color: 'var(--soft-red)' };
  return { text: `${fmtDate(expires)} · ${days}d left`, color: undefined };
}

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<PantagonItem | null>(() => (id ? getCachedItem(id) : null));
  const [loading, setLoading] = useState(() => !(id && getCachedItem(id)));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchItemById(id)
      .then(setItem)
      .catch(error => console.error('Error fetching item:', error))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRate = async (rating: number) => {
    if (!item) return;
    const previous = item.rating;
    const nextRating = previous === rating ? null : rating;
    setItem({ ...item, rating: nextRating });
    setActionError(null);
    try {
      await updateItem(item.id, { rating: nextRating });
    } catch (error) {
      console.error('Error updating rating:', error);
      setItem(prev => (prev ? { ...prev, rating: previous } : prev));
      setActionError('Rating was not saved. Check your connection and try again.');
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    try {
      await deleteItem(item.id);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting item:', error);
      setDeleting(false);
      setDeleteOpen(false);
      setActionError('Item was not deleted. Check your connection and try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
        <div className="skeleton" style={{ height: '36px', width: '70%' }} />
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '200px' }} />
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', textAlign: 'center', gap: '10px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Item not found</div>
        <div style={{ color: 'var(--text-dim)', marginBottom: '6px' }}>It may have been deleted.</div>
        <Button onClick={() => navigate('/')} variant="secondary">Back to items</Button>
      </div>
    );
  }

  const enriched = enrichItemWithMetrics(item);
  const isOwned = item.status === 'owned';
  const profit = enriched.profit ?? 0;
  const profitColor = profit >= 0 ? 'var(--gain)' : 'var(--loss)';
  const perDay = isOwned ? (enriched.cost_per_day ?? 0) : (enriched.avg_cost_per_day_sold ?? 0);
  const detailRows = parseExtraCostDetails(item.extra_cost_details);
  const extraCostRows = detailRows.length > 0 ? detailRows : parseLegacyExtraCostsFromNote(item.note);
  const cleanNote = stripLegacyExtraCostsFromNote(item.note);
  const warranty = item.warranty_expire_date ? warrantyText(item.warranty_expire_date) : null;

  return (
    <div style={{ animation: 'fade-up 0.3s var(--ease-out) both' }}>
      <header style={{ padding: '6px 0 18px' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>
          {item.name}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
          <span className={isOwned ? 'badge-owned' : 'badge-sold'}>{isOwned ? 'Owned' : 'Sold'}</span>
          {(item.tags ?? []).map(tag => (
            <span key={tag} className="tag-chip" style={{ ...tagChipStyle(tag), fontSize: '0.76rem', fontWeight: 600, padding: '3px 10px' }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ marginTop: '6px' }}>
          <StarRating value={item.rating} onChange={handleRate} size={26} />
        </div>
        {actionError && <p role="alert" className="ui-error" style={{ marginTop: '4px' }}>{actionError}</p>}
      </header>

      {/* The two numbers that matter most for this item */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div className="ui-card" style={{ padding: '14px', boxShadow: 'none' }}>
          <div className="hud-label">Total cost</div>
          <div className="num" style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(enriched.real_cost, enriched.real_cost % 1 === 0 ? 0 : 2)}
          </div>
        </div>
        {isOwned ? (
          <div className="ui-card" style={{ padding: '14px', boxShadow: 'none' }}>
            <div className="hud-label">Cost per day</div>
            <div className="num" style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 700, color: 'var(--soft-red)' }}>
              {formatCurrency(perDay)}
            </div>
          </div>
        ) : (
          <div className="ui-card" style={{ padding: '14px', boxShadow: 'none' }}>
            <div className="hud-label">Net profit</div>
            <div className="num" style={{ marginTop: '6px', fontSize: '1.4rem', fontWeight: 700, color: profitColor }}>
              {profit >= 0 ? '+' : '−'}{formatCurrency(Math.abs(profit), 0)}
            </div>
          </div>
        )}
      </div>

      <section className="group" style={{ marginBottom: '14px' }}>
        <h2 className="group__title">Money</h2>
        <Row label="Buy price" value={formatCurrency(item.buy_price)} />
        {item.extra_cost > 0 && <Row label="Extra costs" value={formatCurrency(item.extra_cost)} />}
        {item.sell_price != null && <Row label="Sell price" value={formatCurrency(item.sell_price)} />}
        {!isOwned && item.sell_price != null && (
          <Row label="Profit" value={`${profit >= 0 ? '+' : '−'}${formatCurrency(Math.abs(profit))}`} color={profitColor} />
        )}
        {!isOwned && <Row label="Avg. cost per day" value={formatCurrency(perDay)} />}
      </section>

      {extraCostRows.length > 0 && (
        <section className="group" style={{ marginBottom: '14px' }}>
          <h2 className="group__title">Extra cost breakdown · {extraCostRows.length}</h2>
          {extraCostRows.map(row => (
            <div key={row.id} className="row" style={{ alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500, overflowWrap: 'anywhere' }}>{row.label}</div>
                {row.date && <div className="num" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{fmtDate(row.date)}</div>}
              </div>
              <div className="num" style={{ fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>{formatCurrency(row.amount)}</div>
            </div>
          ))}
        </section>
      )}

      <section className="group" style={{ marginBottom: '14px' }}>
        <h2 className="group__title">Ownership</h2>
        <Row label="Bought" value={fmtDate(item.buy_date)} />
        {item.sell_date && <Row label="Sold" value={fmtDate(item.sell_date)} />}
        <Row label={isOwned ? 'Owned for' : 'Held for'} value={`${enriched.days_held.toLocaleString()} days`} />
        {item.purchase_source && <Row label="Source" value={item.purchase_source} />}
        {warranty && <Row label="Warranty" value={warranty.text} color={warranty.color} />}
        <Row label="Counts in daily burn" value={item.daily_burn ? 'Yes' : 'No'} />
      </section>

      {cleanNote && (
        <section className="group" style={{ marginBottom: '14px' }}>
          <h2 className="group__title">Notes</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{cleanNote}</p>
        </section>
      )}

      {item.reason_to_sell && (
        <section className="group" style={{ marginBottom: '14px' }}>
          <h2 className="group__title">Why it was sold</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.reason_to_sell}</p>
        </section>
      )}

      <p className="num" style={{ margin: '4px 2px 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        Added {format(new Date(item.created_at), 'd MMM yyyy HH:mm')} · Updated {format(new Date(item.updated_at), 'd MMM yyyy HH:mm')}
      </p>

      <ActionBar>
        <Button onClick={() => navigate(`/${item.id}/edit`)} variant="primary" size="lg" style={{ flex: 1 }}>
          Edit item
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setDeleteOpen(true)}
          className="ui-button--icon ui-button--quiet-danger"
          aria-label="Delete item"
        >
          <svg width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9.5 7V5a1 1 0 011-1h3a1 1 0 011 1v2" />
          </svg>
        </Button>
      </ActionBar>

      <Sheet open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title={`Delete “${item.name}”?`}>
        <p style={{ margin: '0 0 18px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          This permanently removes the item and its cost history. It can't be undone.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button variant="danger" size="lg" onClick={handleDelete} disabled={deleting}>
            {deleting ? <span className="spinner" /> : 'Delete item'}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

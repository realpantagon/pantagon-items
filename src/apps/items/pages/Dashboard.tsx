import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addMonths, endOfMonth, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { fetchItems, getCachedItems } from '../../../api/items/api';
import type { PantagonItem } from '../../../api/items/types';
import {
  calculateDailyBurnRate,
  calculateDaysHeld,
  calculateRealCost,
  calculateTotalProfit,
  formatCurrency,
} from '../../../api/items/calculations';
import { parseExtraCostDetails } from '../utils/extraCostDetails';
import ItemCard from '../../items/components/ItemCard';

type ViewMode = 'latest' | 'month';
type StatusFilter = 'owned' | 'sold' | null;

const STATE_KEY = 'pantagon-dashboard-state';
const SCROLL_KEY = 'pantagon-dashboard-scroll';

interface StoredDashboardState {
  searchTerm: string;
  selectedStatus: StatusFilter;
  selectedTag: string | null;
  viewMode: ViewMode;
  monthCursor: string;
}

function loadStoredState(): Partial<StoredDashboardState> {
  try {
    const raw = sessionStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function itemDailyBurn(item: PantagonItem) {
  return calculateRealCost(item.buy_price, item.extra_cost) / calculateDaysHeld(item.buy_date, item.sell_date);
}

/** Purchases bought in the month plus extra costs dated in the month. */
function spendInMonth(items: PantagonItem[], month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const inMonth = (value: string) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date >= start && date <= end;
  };

  let purchases = 0;
  let extras = 0;
  let count = 0;

  for (const item of items) {
    const boughtThisMonth = inMonth(item.buy_date);
    if (boughtThisMonth) {
      purchases += item.buy_price || 0;
      count += 1;
    }

    const detailRows = parseExtraCostDetails(item.extra_cost_details);
    if (detailRows.length > 0) {
      // Dated rows are attributed to the month they were actually spent in
      extras += detailRows.filter(row => inMonth(row.date)).reduce((sum, row) => sum + row.amount, 0);
    } else if (boughtThisMonth) {
      // Legacy records only carry a lump sum, so it falls in the purchase month
      extras += item.extra_cost || 0;
    }
  }

  return { purchases, extras, count, total: purchases + extras };
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="ui-card" style={{ padding: '14px 14px 12px', boxShadow: 'none' }}>
      <div className="hud-label">{label}</div>
      <div className="num" style={{ marginTop: '6px', fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.1, color: color ?? 'var(--text-primary)' }}>
        {value}
      </div>
      {sub && <div className="num" style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState<PantagonItem[]>(() => getCachedItems() ?? []);
  const [loading, setLoading] = useState(() => getCachedItems() === null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => loadStoredState().searchTerm ?? '');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(() => loadStoredState().selectedStatus ?? null);
  const [selectedTag, setSelectedTag] = useState<string | null>(() => loadStoredState().selectedTag ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadStoredState().viewMode ?? 'latest');
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const stored = loadStoredState().monthCursor;
    return stored ? new Date(stored) : startOfMonth(new Date());
  });

  const load = useCallback(async () => {
    try {
      setItems(await fetchItems());
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Could not load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Home-screen apps resume rather than reload, so refresh when brought back
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  // Persist filter/view state so it survives navigating away and back
  useEffect(() => {
    const state: StoredDashboardState = {
      searchTerm,
      selectedStatus,
      selectedTag,
      viewMode,
      monthCursor: monthCursor.toISOString(),
    };
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch {
      // sessionStorage unavailable — state simply won't persist
    }
  }, [searchTerm, selectedStatus, selectedTag, viewMode, monthCursor]);

  // Restore scroll position once items are on screen
  useEffect(() => {
    if (loading) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) requestAnimationFrame(() => window.scrollTo(0, parseInt(saved, 10)));
  }, [loading]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    owned: items.filter(i => i.status === 'owned').length,
    sold: items.filter(i => i.status === 'sold').length,
    dailyBurn: calculateDailyBurnRate(items),
    profit: calculateTotalProfit(items),
    thisMonth: spendInMonth(items, new Date()),
  }), [items]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach(item => (item.tags ?? []).forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [items]);

  const monthSpend = useMemo(() => spendInMonth(items, monthCursor), [items, monthCursor]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const monthStart = startOfMonth(monthCursor);
    const monthEnd = endOfMonth(monthCursor);

    return [...items]
      .sort((a, b) => b.buy_date.localeCompare(a.buy_date) || b.created_at.localeCompare(a.created_at))
      .filter(item => {
        if (viewMode === 'month') {
          const buyDate = new Date(item.buy_date);
          if (buyDate < monthStart || buyDate > monthEnd) return false;
        }
        if (query && !item.name.toLowerCase().includes(query)) return false;
        if (selectedStatus && item.status !== selectedStatus) return false;
        if (selectedTag && !item.tags?.includes(selectedTag)) return false;
        return true;
      });
  }, [items, viewMode, monthCursor, searchTerm, selectedStatus, selectedTag]);

  // Latest view reads as a timeline: one section per purchase month
  const sections = useMemo(() => {
    if (viewMode === 'month') return [{ key: 'month', title: null as string | null, items: filteredItems }];
    const groups = new Map<string, PantagonItem[]>();
    filteredItems.forEach(item => {
      const key = item.buy_date.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return [...groups.entries()].map(([key, groupItems]) => ({
      key,
      title: format(new Date(`${key}-01T00:00:00`), 'MMMM yyyy'),
      items: groupItems,
    }));
  }, [filteredItems, viewMode]);

  const hasFilters = Boolean(searchTerm.trim() || selectedStatus || selectedTag);
  const isCurrentMonth = isSameMonth(monthCursor, new Date());
  const profitColor = stats.profit >= 0 ? 'var(--gain)' : 'var(--loss)';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus(null);
    setSelectedTag(null);
  };

  return (
    <div>
      <div style={{ padding: '6px 0 14px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent)' }}>
          {format(new Date(), 'EEEE d MMMM')}
        </div>
        <h1 style={{ margin: '2px 0 0', fontSize: '2rem', fontWeight: 700, lineHeight: 1.15, color: 'var(--text-primary)' }}>
          Overview
        </h1>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '92px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', animation: 'fade-up 0.35s var(--ease-out) both' }}>
          <Stat label="Owned" value={String(stats.owned)} sub={`of ${stats.total} · ${stats.sold} sold`} />
          <Stat label="Daily burn" value={formatCurrency(stats.dailyBurn)} color="var(--soft-red)" sub={`${formatCurrency(stats.dailyBurn * 30, 0)} / month`} />
          <Stat label="Net P/L" value={`${stats.profit >= 0 ? '+' : '−'}${formatCurrency(Math.abs(stats.profit), 0)}`} color={profitColor} sub="from sold items" />
          <Stat label={format(new Date(), 'MMM')+' spend'} value={formatCurrency(stats.thisMonth.total, 0)} sub={`${stats.thisMonth.count} bought · extra ${formatCurrency(stats.thisMonth.extras, 0)}`} />
        </div>
      )}

      <div className="segmented" style={{ marginBottom: '12px' }}>
        <button type="button" aria-pressed={viewMode === 'latest'} onClick={() => setViewMode('latest')}>Latest</button>
        <button type="button" aria-pressed={viewMode === 'month'} onClick={() => setViewMode('month')}>By month</button>
      </div>

      {viewMode === 'month' && (
        <div className="ui-card" style={{ padding: '6px', marginBottom: '12px', boxShadow: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" className="icon-button" style={{ border: 0 }} onClick={() => setMonthCursor(prev => subMonths(prev, 1))} aria-label="Previous month">
              <ChevronIcon dir="left" />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{format(monthCursor, 'MMMM yyyy')}</div>
              <div className="num" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {monthSpend.count} bought · extra {formatCurrency(monthSpend.extras, 0)} ·{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatCurrency(monthSpend.total, 0)}</span>
              </div>
            </div>
            <button type="button" className="icon-button" style={{ border: 0 }} onClick={() => setMonthCursor(prev => addMonths(prev, 1))} disabled={isCurrentMonth} aria-label="Next month">
              <ChevronIcon dir="right" />
            </button>
          </div>
        </div>
      )}

      <div className="ui-field-shell" style={{ marginBottom: '10px', alignItems: 'center' }}>
        <svg width="17" height="17" fill="none" stroke="var(--text-dim)" strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24" style={{ marginLeft: '14px', flexShrink: 0 }} aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          enterKeyHint="search"
          placeholder="Search items"
          aria-label="Search items"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="ui-input"
          style={{ paddingLeft: '10px' }}
        />
        {searchTerm && (
          <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search" className="icon-button" style={{ border: 0, background: 'none', color: 'var(--text-dim)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 12.1l-1.4 1.4L12 13.4l-2.1 2.1-1.4-1.4 2.1-2.1-2.1-2.1 1.4-1.4 2.1 2.1 2.1-2.1 1.4 1.4-2.1 2.1 2.1 2.1z" />
            </svg>
          </button>
        )}
      </div>

      <div className="chip-row" style={{ marginBottom: '16px' }} role="toolbar" aria-label="Filters">
        <button type="button" className="chip" aria-pressed={!selectedStatus && !selectedTag} onClick={() => { setSelectedStatus(null); setSelectedTag(null); }}>
          All
        </button>
        {(['owned', 'sold'] as const).map(status => (
          <button
            key={status}
            type="button"
            className="chip"
            aria-pressed={selectedStatus === status}
            onClick={() => setSelectedStatus(prev => (prev === status ? null : status))}
          >
            {status === 'owned' ? 'Owned' : 'Sold'}
            <span className="chip__count num">{status === 'owned' ? stats.owned : stats.sold}</span>
          </button>
        ))}
        <span aria-hidden="true" style={{ width: '1px', flexShrink: 0, margin: '6px 2px', background: 'var(--border-strong)' }} />
        {tagCounts.map(([tag, count]) => (
          <button
            key={tag}
            type="button"
            className="chip"
            aria-pressed={selectedTag === tag}
            onClick={() => setSelectedTag(prev => (prev === tag ? null : tag))}
          >
            {tag}
            <span className="chip__count num">{count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="ui-card" role="alert" style={{ padding: '14px 16px', marginBottom: '14px', borderColor: 'color-mix(in srgb, var(--soft-red) 40%, transparent)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Couldn't refresh items</div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-dim)', margin: '2px 0 10px' }}>
            {items.length ? 'Showing the last list loaded.' : error}
          </div>
          <button type="button" className="ui-button ui-button--secondary ui-button--sm" onClick={() => { setLoading(items.length === 0); load(); }}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '118px' }} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Items</h2>
            <span className="num" style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              {hasFilters && (
                <button type="button" onClick={clearFilters} style={{ marginLeft: '10px', padding: 0, border: 0, background: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>
                  Clear filters
                </button>
              )}
            </span>
          </div>

          {sections.map(section => (
            <section key={section.key}>
              {section.title && (
                <div
                  style={{
                    position: 'sticky',
                    top: 'calc(53px + var(--safe-top))',
                    zIndex: 5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 2px 8px',
                    margin: '0 -2px',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <span className="hud-label" style={{ color: 'var(--text-secondary)' }}>{section.title}</span>
                  <span className="hud-label num">{section.items.length}</span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                {section.items.map(item => (
                  <ItemCard key={item.id} item={item} dailyBurn={itemDailyBurn(item)} />
                ))}
              </div>
            </section>
          ))}

          {filteredItems.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '44px 16px', border: '1px dashed var(--border-strong)', borderRadius: '18px' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                {hasFilters ? 'No items match' : viewMode === 'month' ? `Nothing bought in ${format(monthCursor, 'MMMM')}` : 'No items yet'}
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginBottom: hasFilters ? '12px' : 0 }}>
                {hasFilters ? 'Try a different search or filter.' : 'Tap Add to register your first item.'}
              </div>
              {hasFilters && (
                <button type="button" className="ui-button ui-button--secondary ui-button--sm" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          )}
        </>
      )}

      <Link to="/new" className="fab" aria-label="Add item">
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add
      </Link>
    </div>
  );
}

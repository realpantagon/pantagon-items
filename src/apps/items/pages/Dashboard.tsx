import { useEffect, useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { supabase } from '../../../shared/utils/supabase';
import type { DashboardStats, PantagonItem } from '../../../api/items/types';
import { calculateDailyBurnRate, calculateTotalProfit, formatCurrency } from '../../../api/items/calculations';
import { parseExtraCostDetails } from '../utils/extraCostDetails';
import ItemCard from '../../items/components/ItemCard';
import Button from '../../../shared/components/Button';

type ViewMode = 'month' | 'latest';

const LATEST_PAGE_SIZE = 5;

function StatCard({
  label,
  value,
  accent,
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  accent: string;
  icon: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        padding: '12px 13px',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-sm)',
        animation: `fade-up 0.45s ease both`,
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div className="hud-label" style={{ fontSize: '7px', letterSpacing: '0.12em' }}>{label}</div>
        <div style={{ color: accent, opacity: 0.72 }}>{icon}</div>
      </div>
      <div
        className="font-ui"
        style={{
          fontSize: '22px',
          fontWeight: 700,
          color: accent,
          letterSpacing: '0.01em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<PantagonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [monthCursor, setMonthCursor] = useState<Date>(startOfMonth(new Date()));
  const [latestPage, setLatestPage] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateItemDailyBurn = (item: PantagonItem) => {
    const daysHeld = item.sell_date
      ? Math.max(1, Math.floor((new Date(item.sell_date).getTime() - new Date(item.buy_date).getTime()) / 86400000))
      : Math.max(1, Math.floor((Date.now() - new Date(item.buy_date).getTime()) / 86400000));
    return (item.buy_price + item.extra_cost) / daysHeld;
  };

  const fetchDashboardData = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('Pantagon_items')
        .select('*')
        .order('buy_date', { ascending: false });
      if (error) throw error;

      if (rows) {
        setStats({
          total_items: rows.length,
          owned_items: rows.filter(i => i.status === 'owned').length,
          sold_items: rows.filter(i => i.status === 'sold').length,
          daily_burn_rate: calculateDailyBurnRate(rows),
          total_profit: calculateTotalProfit(rows),
        });

        setItems(rows);

        const tags = Array.from(new Set(rows.flatMap(i => i.tags || []).filter(Boolean))) as string[];
        setAllTags(tags.sort());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const modeItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.buy_date).getTime() - new Date(a.buy_date).getTime());

    if (viewMode === 'latest') {
      return sorted;
    }

    const monthStart = startOfMonth(monthCursor);
    const monthEnd = endOfMonth(monthCursor);

    return sorted.filter(item => {
      const buyDate = new Date(item.buy_date);
      return buyDate >= monthStart && buyDate <= monthEnd;
    });
  }, [items, viewMode, monthCursor]);

  const monthSpend = useMemo(() => {
    const monthStart = startOfMonth(monthCursor);
    const monthEnd = endOfMonth(monthCursor);
    const inMonth = (value: string) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date >= monthStart && date <= monthEnd;
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
        extras += detailRows
          .filter(row => inMonth(row.date))
          .reduce((sum, row) => sum + row.amount, 0);
      } else if (boughtThisMonth) {
        // Legacy records only carry a lump sum, so it falls in the purchase month
        extras += item.extra_cost || 0;
      }
    }

    return { purchases, extras, count, total: purchases + extras };
  }, [items, monthCursor]);

  const filteredItems = useMemo(() => {
    let filtered = [...modeItems];

    if (searchTerm.trim()) {
      filtered = filtered.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (selectedStatus) {
      filtered = filtered.filter(i => i.status === selectedStatus);
    }

    if (selectedTag) {
      filtered = filtered.filter(i => i.tags && i.tags.includes(selectedTag));
    }

    return filtered;
  }, [modeItems, searchTerm, selectedStatus, selectedTag]);

  const latestPageCount = Math.max(1, Math.ceil(filteredItems.length / LATEST_PAGE_SIZE));

  const visibleItems = useMemo(() => {
    if (viewMode !== 'latest') return filteredItems;
    const start = latestPage * LATEST_PAGE_SIZE;
    return filteredItems.slice(start, start + LATEST_PAGE_SIZE);
  }, [filteredItems, viewMode, latestPage]);

  useEffect(() => {
    setLatestPage(0);
  }, [viewMode, searchTerm, selectedStatus, selectedTag]);

  useEffect(() => {
    if (latestPage > latestPageCount - 1) setLatestPage(latestPageCount - 1);
  }, [latestPage, latestPageCount]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '1px solid var(--border-subtle)',
            borderTop: '1px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="hud-label" style={{ letterSpacing: '0.18em' }}>Loading system data...</div>
      </div>
    );
  }

  const profit = stats?.total_profit || 0;
  const profitColor = profit >= 0 ? 'var(--gain)' : 'var(--loss)';
  const isCurrentMonth = isSameMonth(monthCursor, new Date());

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div style={{ marginBottom: '18px', paddingTop: '4px', animation: 'slide-up 0.4s ease both' }}>
        <div className="font-ui" style={{ color: 'var(--accent-strong)', fontSize: '0.95rem', marginBottom: '0.25rem', fontWeight: 600 }}>
          {format(new Date(), 'EEEE')} <span style={{ color: 'var(--text-dim)', marginLeft: '0.35rem', fontWeight: 500 }}>{format(new Date(), 'MMM d')}</span>
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: '2.5rem',
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.02,
          }}
        >
          Pantagon Items
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
        <StatCard
          label="TOTAL ASSETS"
          value={String(stats?.total_items || 0)}
          accent="var(--text-primary)"
          delay={0.05}
          icon={
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="ACTIVE"
          value={String(stats?.owned_items || 0)}
          accent="var(--accent-strong)"
          delay={0.1}
          icon={
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatCard
          label="NET P/L"
          value={stats ? formatCurrency(profit, 0) : '฿0'}
          accent={profitColor}
          delay={0.15}
          icon={
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="DAILY BURN"
          value={stats ? formatCurrency(stats.daily_burn_rate) : '฿0'}
          accent="var(--soft-red)"
          delay={0.2}
          icon={
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />
      </div>

      <div style={{ animation: 'slide-up 0.5s ease 0.25s both' }}>
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '1rem', padding: '4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '10px', background: 'var(--bg-surface)' }}>
          <button
            onClick={() => setViewMode('month')}
            className="ui-button ui-button--md"
            style={{
              background: viewMode === 'month' ? 'var(--bg-elevated)' : 'transparent',
              borderColor: viewMode === 'month' ? 'var(--border-strong)' : 'transparent',
              color: viewMode === 'month' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('latest')}
            className="ui-button ui-button--md"
            style={{
              background: viewMode === 'latest' ? 'var(--bg-elevated)' : 'transparent',
              borderColor: viewMode === 'latest' ? 'var(--border-strong)' : 'transparent',
              color: viewMode === 'latest' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Latest
          </button>
        </div>

        {viewMode === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMonthCursor(prev => subMonths(prev, 1))}
              className="ui-button--nav"
              aria-label="Previous month"
              title="Previous month"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 6l-6 6 6 6" />
              </svg>
            </Button>
            <div className="font-ui" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {format(monthCursor, 'MMMM yyyy')}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMonthCursor(prev => addMonths(prev, 1))}
              disabled={isCurrentMonth}
              className="ui-button--nav"
              aria-label="Next month"
              title="Next month"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 6l6 6-6 6" />
              </svg>
            </Button>
          </div>
        )}

        {viewMode === 'month' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '0 2px 10px',
            marginBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="hud-label" style={{ fontSize: '7px', letterSpacing: '0.12em' }}>
            Spent in {format(monthCursor, 'MMMM yyyy')}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
            {monthSpend.count} {monthSpend.count === 1 ? 'item' : 'items'} · extra {formatCurrency(monthSpend.extras, 0)}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}> · {formatCurrency(monthSpend.total, 0)}</span>
          </div>
        </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '14px', background: 'var(--accent)' }} />
            <h2 className="font-display" style={{ margin: 0, fontSize: '1.02rem', letterSpacing: '0.01em', fontWeight: 500, color: 'var(--text-primary)' }}>
              Asset registry
            </h2>
          </div>
          <div className="hud-label" style={{ fontSize: '8px' }}>{filteredItems.length} RECORDS</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: '8px', marginBottom: '10px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '2px', background: 'var(--accent)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }}>
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search asset name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '34px',
              paddingRight: '12px',
              paddingTop: '12px',
              paddingBottom: '12px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderLeft: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              letterSpacing: '0.01em',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              borderRadius: '1rem',
            }}
          />
        </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="font-ui"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 1rem',
              background: showFilters ? 'var(--accent-soft)' : 'var(--bg-elevated)',
              border: `1px solid ${showFilters ? 'var(--accent)' : 'var(--border-subtle)'}`,
              color: showFilters ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.84rem',
              letterSpacing: '0.01em',
              cursor: 'pointer',
              borderRadius: '1rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.16s ease',
            }}
          >
            Filters {showFilters ? '−' : '+'}
          </button>
        </div>

        {(selectedStatus || selectedTag) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {selectedStatus && (
            <button
              onClick={() => setSelectedStatus(null)}
              className="font-ui"
              style={{
                padding: '0.5rem 0.82rem',
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-strong)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: '999px',
              }}
            >
              Status: {selectedStatus.toUpperCase()} ×
            </button>
          )}

          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="font-ui"
              style={{
                padding: '0.5rem 0.82rem',
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-strong)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                borderRadius: '999px',
              }}
            >
              Tag: {selectedTag.toUpperCase()} ×
            </button>
          )}
        </div>
        )}

        {showFilters && (
          <div
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              padding: '13px',
              marginBottom: '12px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              animation: 'slide-up 0.2s ease both',
              borderRadius: '1.1rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '120px' }}>
              <span className="hud-label" style={{ fontSize: '7px' }}>Status filter</span>
              <select
                value={selectedStatus || ''}
                onChange={e => setSelectedStatus(e.target.value || null)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  padding: '6px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  borderRadius: '0.85rem',
                }}
              >
                <option value="">All status</option>
                <option value="owned">Owned</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            {allTags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '120px' }}>
                <span className="hud-label" style={{ fontSize: '7px' }}>Tag filter</span>
                <select
                  value={selectedTag || ''}
                  onChange={e => setSelectedTag(e.target.value || null)}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    padding: '6px 8px',
                    outline: 'none',
                    cursor: 'pointer',
                    borderRadius: '0.85rem',
                  }}
                >
                  <option value="">All tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {visibleItems.map((item, i) => (
            <div key={item.id} style={{ animation: `fade-up 0.3s ease ${i * 0.03}s both` }}>
              <ItemCard item={item} dailyBurn={calculateItemDailyBurn(item)} />
            </div>
          ))}
        </div>

        {viewMode === 'latest' && filteredItems.length > LATEST_PAGE_SIZE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '14px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLatestPage(prev => Math.max(0, prev - 1))}
              disabled={latestPage === 0}
              className="ui-button--nav"
              aria-label="Newer assets"
              title="Newer"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 6l-6 6 6 6" />
              </svg>
            </Button>
            <div className="hud-label" style={{ fontSize: '8px' }}>
              Page {latestPage + 1} / {latestPageCount}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLatestPage(prev => Math.min(latestPageCount - 1, prev + 1))}
              disabled={latestPage >= latestPageCount - 1}
              className="ui-button--nav"
              aria-label="Older assets"
              title="Older"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 6l6 6-6 6" />
              </svg>
            </Button>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 16px',
              border: '1px dashed var(--border-subtle)',
              textAlign: 'center',
              borderRadius: '1rem',
              marginTop: '10px',
            }}
          >
            <div className="font-ui" style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
              No records found
            </div>
            <div className="font-ui" style={{ fontSize: '0.84rem', color: 'var(--text-dim)' }}>
              Adjust filters or add a new asset
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

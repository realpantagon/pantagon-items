import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/utils/supabase';
import type { DashboardStats, PantagonItem } from '../../../api/items/types';
import { calculateDailyBurnRate, calculateTotalProfit, formatCurrency } from '../../../api/items/calculations';
import ItemCard from '../../items/components/ItemCard';

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
        background: 'rgba(11,11,11,0.85)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${accent}30`,
        borderTop: `1px solid ${accent}60`,
        padding: '14px',
        position: 'relative',
        overflow: 'hidden',
        animation: `slide-up 0.5s ease both`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Corner decoration */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '20px',
          height: '20px',
          borderTop: `1px solid ${accent}50`,
          borderRight: `1px solid ${accent}50`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '20px',
          height: '20px',
          borderBottom: `1px solid ${accent}30`,
          borderLeft: `1px solid ${accent}30`,
        }}
      />

      {/* Top energy line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animation: 'energy-line 5s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div
          className="hud-label"
          style={{ fontSize: '8px', letterSpacing: '0.15em' }}
        >
          {label}
        </div>
        <div style={{ color: accent, opacity: 0.7 }}>{icon}</div>
      </div>
      <div
        className="font-display"
        style={{
          fontSize: '20px',
          fontWeight: 700,
          color: accent,
          textShadow: `0 0 12px ${accent}60`,
          letterSpacing: '0.05em',
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
  const [filteredItems, setFilteredItems] = useState<PantagonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchDashboardData(); }, []);
  useEffect(() => { filterItems(); }, [items, searchTerm, selectedStatus, selectedTag]);

  const filterItems = () => {
    let filtered = [...items];
    if (searchTerm) filtered = filtered.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedStatus) filtered = filtered.filter(i => i.status === selectedStatus);
    if (selectedTag) filtered = filtered.filter(i => i.tags && i.tags.includes(selectedTag));
    setFilteredItems(filtered);
    setCurrentPage(1);
  };

  const calculateItemDailyBurn = (item: PantagonItem) => {
    const daysHeld = item.sell_date
      ? Math.max(1, Math.floor((new Date(item.sell_date).getTime() - new Date(item.buy_date).getTime()) / 86400000))
      : Math.max(1, Math.floor((Date.now() - new Date(item.buy_date).getTime()) / 86400000));
    return (item.buy_price + item.extra_cost) / daysHeld;
  };

  const fetchDashboardData = async () => {
    try {
      const { data: items, error } = await supabase
        .from('Pantagon_items')
        .select('*')
        .order('buy_date', { ascending: false });
      if (error) throw error;
      if (items) {
        setStats({
          total_items: items.length,
          owned_items: items.filter(i => i.status === 'owned').length,
          sold_items: items.filter(i => i.status === 'sold').length,
          daily_burn_rate: calculateDailyBurnRate(items),
          total_profit: calculateTotalProfit(items),
        });
        setItems(items);
        setFilteredItems(items);
        const tags = Array.from(new Set(items.flatMap(i => i.tags || []).filter(Boolean))) as string[];
        setAllTags(tags.sort());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '1px solid rgba(255,43,43,0.3)',
            borderTop: '1px solid var(--neon-red)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="hud-label" style={{ letterSpacing: '0.2em' }}>LOADING SYSTEM DATA...</div>
      </div>
    );
  }

  const profit = stats?.total_profit || 0;
  const profitColor = profit >= 0 ? '#00E676' : '#FF5A5A';

  return (
    <div style={{ paddingBottom: '80px' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: '20px', paddingTop: '8px', animation: 'slide-up 0.4s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ height: '1px', width: '20px', background: 'var(--neon-red)', boxShadow: '0 0 6px var(--neon-red)' }} />
          <span className="hud-label" style={{ fontSize: '8px', color: 'var(--neon-red)', letterSpacing: '0.25em' }}>
            ASSET MANAGEMENT SYSTEM v2.4
          </span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,43,43,0.4), transparent)' }} />
        </div>
        <h1
          className="font-display"
          style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          SYSTEM OVERVIEW
        </h1>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        <StatCard
          label="TOTAL ASSETS"
          value={String(stats?.total_items || 0)}
          accent="#00ffff"
          delay={0.05}
          icon={
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="ACTIVE UNITS"
          value={String(stats?.owned_items || 0)}
          accent="#00E676"
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
          accent="var(--neon-red)"
          delay={0.2}
          icon={
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          }
        />
      </div>

      {/* ── Items Section ── */}
      <div style={{ animation: 'slide-up 0.5s ease 0.25s both' }}>

        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255,43,43,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '14px', background: 'var(--neon-red)', boxShadow: '0 0 6px var(--neon-red)' }} />
            <h2
              className="font-display"
              style={{ margin: 0, fontSize: '11px', letterSpacing: '0.18em', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              ASSET REGISTRY
            </h2>
          </div>
          <div className="hud-label" style={{ fontSize: '8px' }}>
            {filteredItems.length} RECORDS
          </div>
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '2px',
              background: 'rgba(255,43,43,0.4)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '14px',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'rgba(255,43,43,0.5)',
            }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="SEARCH ASSETS..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '34px',
              paddingRight: '12px',
              paddingTop: '10px',
              paddingBottom: '10px',
              background: 'rgba(8,8,8,0.9)',
              border: '1px solid rgba(255,43,43,0.15)',
              borderLeft: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              (e.currentTarget).style.borderColor = 'rgba(255,43,43,0.5)';
              (e.currentTarget).style.boxShadow = '0 0 16px rgba(255,43,43,0.1)';
            }}
            onBlur={e => {
              (e.currentTarget).style.borderColor = 'rgba(255,43,43,0.15)';
              (e.currentTarget).style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="font-display"
            style={{
              padding: '4px 10px',
              background: showFilters ? 'rgba(255,43,43,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showFilters ? 'rgba(255,43,43,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: showFilters ? 'var(--soft-red)' : 'var(--text-dim)',
              fontSize: '8px',
              letterSpacing: '0.14em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            FILTERS {showFilters ? '−' : '+'}
          </button>

          {/* Active filter chips */}
          {selectedStatus && (
            <button
              onClick={() => setSelectedStatus(null)}
              className="font-display"
              style={{
                padding: '4px 10px',
                background: 'rgba(255,43,43,0.1)',
                border: '1px solid rgba(255,43,43,0.35)',
                color: 'var(--soft-red)',
                fontSize: '8px',
                letterSpacing: '0.12em',
                cursor: 'pointer',
              }}
            >
              STATUS: {selectedStatus.toUpperCase()} ×
            </button>
          )}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="font-display"
              style={{
                padding: '4px 10px',
                background: 'rgba(255,43,43,0.1)',
                border: '1px solid rgba(255,43,43,0.35)',
                color: 'var(--soft-red)',
                fontSize: '8px',
                letterSpacing: '0.12em',
                cursor: 'pointer',
              }}
            >
              TAG: {selectedTag.toUpperCase()} ×
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            style={{
              background: 'rgba(8,8,8,0.9)',
              border: '1px solid rgba(255,43,43,0.15)',
              padding: '12px',
              marginBottom: '12px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              animation: 'slide-up 0.2s ease both',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '120px' }}>
              <span className="hud-label" style={{ fontSize: '7px' }}>STATUS FILTER</span>
              <select
                value={selectedStatus || ''}
                onChange={e => setSelectedStatus(e.target.value || null)}
                style={{
                  background: 'rgba(5,5,5,0.9)',
                  border: '1px solid rgba(255,43,43,0.2)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '13px',
                  padding: '6px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Status</option>
                <option value="owned">Owned</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            {allTags.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '120px' }}>
                <span className="hud-label" style={{ fontSize: '7px' }}>TAG FILTER</span>
                <select
                  value={selectedTag || ''}
                  onChange={e => setSelectedTag(e.target.value || null)}
                  style={{
                    background: 'rgba(5,5,5,0.9)',
                    border: '1px solid rgba(255,43,43,0.2)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-tech)',
                    fontSize: '13px',
                    padding: '6px 8px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">All Tags</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {paginatedItems.map((item, i) => (
            <div
              key={item.id}
              style={{ animation: `slide-up 0.3s ease ${i * 0.04}s both` }}
            >
              <ItemCard item={item} dailyBurn={calculateItemDailyBurn(item)} />
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredItems.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 16px',
              border: '1px dashed rgba(255,43,43,0.2)',
              textAlign: 'center',
              animation: 'fade-in 0.4s ease both',
            }}
          >
            <div
              className="font-display"
              style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--text-dim)', marginBottom: '8px' }}
            >
              NO RECORDS FOUND
            </div>
            <div
              className="font-tech"
              style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}
            >
              Adjust search filters or add new assets
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              paddingTop: '16px',
              marginTop: '8px',
              borderTop: '1px solid rgba(255,43,43,0.1)',
            }}
          >
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,43,43,0.08)',
                border: '1px solid rgba(255,43,43,0.2)',
                color: 'var(--neon-red)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.3 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
              }}
            >
              ‹
            </button>
            <span
              className="font-display"
              style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}
            >
              PAGE {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,43,43,0.08)',
                border: '1px solid rgba(255,43,43,0.2)',
                color: 'var(--neon-red)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.3 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '12px',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

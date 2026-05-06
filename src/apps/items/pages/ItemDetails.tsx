import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import type { PantagonItem } from '../../../api/items/types';
import { enrichItemWithMetrics, formatCurrency } from '../../../api/items/calculations';
import { format } from 'date-fns';
import Button from '../../../shared/components/Button';

function DataRow({ label, value, accent }: { label: string; value: string | React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        gap: '8px',
      }}
    >
      <span className="hud-label" style={{ fontSize: '8px', flexShrink: 0 }}>{label}</span>
      <span
        className="font-tech"
        style={{
          fontSize: '13px',
          color: accent || 'var(--text-primary)',
          textAlign: 'right',
          fontWeight: accent ? 600 : 400,
          textShadow: accent ? `0 0 10px ${accent}60` : 'none',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PanelHeader({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingBottom: '10px',
        marginBottom: '4px',
        borderBottom: '1px solid rgba(255,43,43,0.15)',
      }}
    >
      {icon && <div style={{ color: 'rgba(255,43,43,0.7)' }}>{icon}</div>}
      <span
        className="font-display"
        style={{ fontSize: '9px', letterSpacing: '0.2em', fontWeight: 600, color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,43,43,0.2), transparent)' }} />
    </div>
  );
}

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<PantagonItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchItem(id); }, [id]);

  const fetchItem = async (itemId: string) => {
    try {
      const { data, error } = await supabase
        .from('Pantagon_items')
        .select('*')
        .eq('id', itemId)
        .single();
      if (error) throw error;
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm('CONFIRM: Delete this asset from the registry?')) return;
    try {
      const { error } = await supabase.from('Pantagon_items').delete().eq('id', item.id);
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete asset');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px' }}>
        <div
          style={{
            width: '40px', height: '40px',
            border: '1px solid rgba(255,43,43,0.3)',
            borderTop: '1px solid var(--neon-red)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="hud-label" style={{ letterSpacing: '0.2em' }}>ACCESSING RECORD...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '12px' }}>
        <div
          className="font-display"
          style={{ fontSize: '36px', color: 'rgba(255,43,43,0.2)', fontWeight: 900, letterSpacing: '0.1em' }}
        >
          404
        </div>
        <div className="font-display" style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'var(--text-dim)' }}>RECORD NOT FOUND</div>
        <Button onClick={() => navigate('/')} variant="secondary" size="sm">
          ← RETURN TO GRID
        </Button>
      </div>
    );
  }

  const enriched = enrichItemWithMetrics(item);
  const isOwned = item.status === 'owned';
  const profit = enriched.profit || 0;
  const profitColor = profit >= 0 ? '#00E676' : '#FF5A5A';

  return (
    <div style={{ paddingBottom: '100px' }}>

      {/* ── Back + Header ── */}
      <div style={{ paddingTop: '8px', marginBottom: '16px', animation: 'slide-up 0.4s ease both' }}>
        <button
          onClick={() => navigate('/')}
          className="font-display"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '8px',
            letterSpacing: '0.15em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 0 12px 0',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--neon-red)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; }}
        >
          ‹ ASSET REGISTRY
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ height: '1px', width: '16px', background: 'var(--neon-red)', boxShadow: '0 0 6px var(--neon-red)' }} />
          <span className="hud-label" style={{ fontSize: '8px', color: 'var(--neon-red)' }}>ASSET DETAIL</span>
        </div>

        <h1
          className="font-ui"
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
            letterSpacing: '0.02em',
          }}
        >
          {item.name}
        </h1>

        {/* Status + tags row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {isOwned ? (
            <span className="badge-owned">OWNED</span>
          ) : (
            <span className="badge-sold">SOLD</span>
          )}
          {item.tags && item.tags.length > 0 && (
            <>
              <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }} />
              {item.tags.map(tag => (
                <span
                  key={tag}
                  className="font-display"
                  style={{
                    fontSize: '7px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    background: 'rgba(255,43,43,0.07)',
                    border: '1px solid rgba(255,43,43,0.2)',
                    color: 'rgba(255,90,90,0.7)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Financial panel ── */}
      <div
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,43,43,0.15)',
          borderTop: '1px solid rgba(255,43,43,0.4)',
          padding: '16px',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slide-up 0.4s ease 0.05s both',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon-red), transparent)', animation: 'energy-line 6s ease-in-out infinite' }} />

        <PanelHeader
          label="FINANCIAL DATA"
          icon={<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />

        {/* Key financial figures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,43,43,0.08)', marginBottom: '12px' }}>
          {[
            { label: 'BUY PRICE', value: formatCurrency(item.buy_price), accent: 'var(--text-primary)' },
            { label: 'TOTAL COST', value: formatCurrency(enriched.real_cost), accent: '#9A9AFF' },
            ...(item.sell_price ? [
              { label: 'SELL PRICE', value: formatCurrency(item.sell_price), accent: 'var(--text-primary)' },
              { label: 'NET PROFIT', value: formatCurrency(profit), accent: profitColor },
            ] : []),
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              style={{
                background: 'rgba(8,8,8,0.9)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div className="hud-label" style={{ fontSize: '7px' }}>{label}</div>
              <div
                className="font-tech"
                style={{ fontSize: '18px', fontWeight: 700, color: accent, textShadow: `0 0 10px ${accent}50` }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {item.extra_cost > 0 && (
          <DataRow label="EXTRA COSTS" value={formatCurrency(item.extra_cost)} />
        )}
      </div>

      {/* ── Performance panel ── */}
      <div
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,43,43,0.15)',
          borderTop: '1px solid rgba(255,43,43,0.4)',
          padding: '16px',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slide-up 0.4s ease 0.1s both',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon-red), transparent)', animation: 'energy-line 8s ease-in-out infinite 2s' }} />

        <PanelHeader
          label="PERFORMANCE METRICS"
          icon={<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />

        {/* Daily burn highlight */}
        <div
          style={{
            background: 'rgba(255,43,43,0.06)',
            border: '1px solid rgba(255,43,43,0.2)',
            padding: '12px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div className="hud-label" style={{ fontSize: '8px', marginBottom: '4px' }}>DAILY BURN RATE</div>
            {!isOwned && <div className="hud-label" style={{ fontSize: '7px', color: 'var(--text-dim)' }}>AVG WHILE OWNED</div>}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--neon-red)',
              textShadow: '0 0 12px rgba(255,43,43,0.6)',
            }}
          >
            {formatCurrency(isOwned ? (enriched.cost_per_day || 0) : (enriched.avg_cost_per_day_sold || 0))}
            <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>/DAY</span>
          </div>
        </div>

        <DataRow label="DAYS HELD" value={`${enriched.days_held} DAYS`} />
        <DataRow label="ACQUIRED" value={format(new Date(item.buy_date), 'MMM d, yyyy').toUpperCase()} />
        {item.sell_date && (
          <DataRow label="DIVESTED" value={format(new Date(item.sell_date), 'MMM d, yyyy').toUpperCase()} />
        )}
      </div>

      {/* ── Details panel ── */}
      <div
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,43,43,0.15)',
          borderTop: '1px solid rgba(255,43,43,0.4)',
          padding: '16px',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'slide-up 0.4s ease 0.15s both',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon-red), transparent)', animation: 'energy-line 10s ease-in-out infinite 1s' }} />

        <PanelHeader
          label="METADATA"
          icon={<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />

        {item.purchase_source && <DataRow label="SOURCE" value={item.purchase_source} />}
        {item.warranty_expire_date && (
          <DataRow
            label="WARRANTY EXP."
            value={format(new Date(item.warranty_expire_date), 'MMM d, yyyy').toUpperCase()}
          />
        )}

        {item.note && (
          <div style={{ marginTop: '10px' }}>
            <div className="hud-label" style={{ fontSize: '8px', marginBottom: '6px' }}>NOTES</div>
            <div
              className="font-tech"
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                background: 'rgba(5,5,5,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '2px solid rgba(255,43,43,0.3)',
                padding: '10px 12px',
                lineHeight: 1.6,
              }}
            >
              {item.note}
            </div>
          </div>
        )}

        {item.reason_to_sell && (
          <div style={{ marginTop: '10px' }}>
            <div className="hud-label" style={{ fontSize: '8px', marginBottom: '6px' }}>REASON FOR DIVEST</div>
            <div
              className="font-tech"
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                background: 'rgba(5,5,5,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderLeft: '2px solid rgba(255,43,43,0.3)',
                padding: '10px 12px',
                lineHeight: 1.6,
              }}
            >
              {item.reason_to_sell}
            </div>
          </div>
        )}

        <div
          className="hud-label"
          style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '7px', display: 'flex', justifyContent: 'space-between' }}
        >
          <span>CREATED {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</span>
          <span>UPDATED {format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm')}</span>
        </div>
      </div>

      {/* ── Fixed action bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          maxWidth: '480px',
          margin: '0 auto',
          padding: '10px 16px',
          background: 'rgba(5,5,5,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,43,43,0.2)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <Button
          onClick={() => navigate(`/${item.id}/edit`)}
          variant="primary"
          size="lg"
          style={{ flex: 1 }}
        >
          EDIT ASSET
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          size="lg"
          style={{ flexShrink: 0, minWidth: '80px' }}
        >
          DELETE
        </Button>
      </div>
    </div>
  );
}

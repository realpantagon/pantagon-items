import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import type { PantagonItem } from '../../../api/items/types';
import { enrichItemWithMetrics, formatCurrency } from '../../../api/items/calculations';
import { format } from 'date-fns';
import { tagChipStyle } from '../utils/tagColor';
import Button from '../../../shared/components/Button';
import {
  parseExtraCostDetails,
  parseLegacyExtraCostsFromNote,
  stripLegacyExtraCostsFromNote,
} from '../utils/extraCostDetails';

function DataRow({ label, value, accent }: { label: string; value: string | React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
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
          borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {icon && <div style={{ color: 'var(--accent)' }}>{icon}</div>}
      <span
        className="font-display"
        style={{ fontSize: '9px', letterSpacing: '0.2em', fontWeight: 600, color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 28%, transparent), transparent)' }} />
    </div>
  );
}

export default function ItemDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<PantagonItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

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
            border: '1px solid var(--border-subtle)',
            borderTop: '1px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div className="hud-label" style={{ letterSpacing: '0.18em' }}>Accessing record...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: '12px' }}>
        <div
          className="font-display"
          style={{ fontSize: '36px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.02em' }}
        >
          404
        </div>
        <div className="font-display" style={{ fontSize: '10px', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>Record not found</div>
        <Button onClick={() => navigate('/')} variant="secondary" size="sm">
          Return to dashboard
        </Button>
      </div>
    );
  }

  const enriched = enrichItemWithMetrics(item);
  const isOwned = item.status === 'owned';
  const profit = enriched.profit || 0;
  const profitColor = profit >= 0 ? 'var(--gain)' : 'var(--loss)';
  const extraCostRows = parseExtraCostDetails(item.extra_cost_details).length > 0
    ? parseExtraCostDetails(item.extra_cost_details)
    : parseLegacyExtraCostsFromNote(item.note);
  const cleanNote = stripLegacyExtraCostsFromNote(item.note);

  return (
    <div style={{ paddingBottom: '100px' }}>

      {/* ── Back + Header ── */}
      <div style={{ paddingTop: '14px', marginBottom: '16px', animation: 'fade-up 0.4s ease both' }}>
        <button
          onClick={() => navigate('/')}
          className="font-display"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.5rem 0.9rem',
            borderRadius: '999px',
            transition: 'all 0.16s ease',
            marginBottom: '20px',
          }}
        >
          Back to dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{ height: '1px', width: '16px', background: 'var(--accent)' }} />
          <span className="hud-label" style={{ fontSize: '8px', color: 'var(--accent)' }}>Asset detail</span>
        </div>

        <h1
          className="font-ui"
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
            letterSpacing: '0.01em',
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
                  className="tag-chip"
                  style={{
                    ...tagChipStyle(tag),
                    fontSize: '0.66rem',
                    letterSpacing: '0.02em',
                    fontWeight: 600,
                    padding: '2px 9px',
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
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          padding: '1rem',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fade-up 0.4s ease 0.05s both',
          borderRadius: '1.2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <PanelHeader
          label="FINANCIAL DATA"
          icon={<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />

        {/* Key financial figures */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-subtle)', marginBottom: '12px' }}>
          {[
            { label: 'BUY PRICE', value: formatCurrency(item.buy_price), accent: 'var(--text-primary)' },
            { label: 'TOTAL COST', value: formatCurrency(enriched.real_cost), accent: 'var(--text-primary)' },
            ...(item.sell_price ? [
              { label: 'SELL PRICE', value: formatCurrency(item.sell_price), accent: 'var(--text-primary)' },
              { label: 'NET PROFIT', value: formatCurrency(profit), accent: profitColor },
            ] : []),
          ].map(({ label, value, accent }) => (
            <div
              key={label}
              style={{
                background: 'var(--bg-elevated)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div className="hud-label" style={{ fontSize: '7px' }}>{label}</div>
              <div
                className="font-tech"
                  style={{ fontSize: '18px', fontWeight: 700, color: accent }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {item.extra_cost > 0 && (
          <DataRow label="EXTRA COSTS" value={formatCurrency(item.extra_cost)} />
        )}

        {extraCostRows.length > 0 && (
          <div style={{ marginTop: '10px', border: '1px solid var(--border-subtle)', borderRadius: '0.9rem', overflow: 'hidden' }}>
            <div className="hud-label" style={{ fontSize: '7px', padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
              EXTRA COST BREAKDOWN
            </div>
            {extraCostRows.map(row => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr auto',
                  gap: '8px',
                  padding: '9px 10px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    {row.date || '-'}
                  </div>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>
                  {formatCurrency(row.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Performance panel ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          padding: '1rem',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fade-up 0.4s ease 0.1s both',
          borderRadius: '1.2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <PanelHeader
          label="PERFORMANCE METRICS"
          icon={<svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
        />

        {/* Daily burn highlight */}
        <div
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--border-subtle)',
            padding: '12px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '1rem',
          }}
        >
          <div>
            <div className="hud-label" style={{ fontSize: '8px', marginBottom: '4px' }}>Daily burn rate</div>
            {!isOwned && <div className="hud-label" style={{ fontSize: '7px', color: 'var(--text-dim)' }}>Average while owned</div>}
          </div>
          <div
            className="font-display"
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            {formatCurrency(isOwned ? (enriched.cost_per_day || 0) : (enriched.avg_cost_per_day_sold || 0))}
            <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>/day</span>
          </div>
        </div>

        <DataRow label="Days held" value={`${enriched.days_held} days`} />
        <DataRow label="Acquired" value={format(new Date(item.buy_date), 'MMM d, yyyy').toUpperCase()} />
        {item.sell_date && (
          <DataRow label="Divested" value={format(new Date(item.sell_date), 'MMM d, yyyy').toUpperCase()} />
        )}
      </div>

      {/* ── Details panel ── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          padding: '1rem',
          marginBottom: '8px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fade-up 0.4s ease 0.15s both',
          borderRadius: '1.2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
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

        {cleanNote && (
          <div style={{ marginTop: '10px' }}>
            <div className="hud-label" style={{ fontSize: '8px', marginBottom: '6px' }}>NOTES</div>
            <div
              className="font-tech"
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '2px solid var(--accent)',
                padding: '10px 12px',
                lineHeight: 1.6,
                borderRadius: '0.85rem',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {cleanNote}
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
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '2px solid var(--accent)',
                padding: '10px 12px',
                lineHeight: 1.6,
                borderRadius: '0.85rem',
              }}
            >
              {item.reason_to_sell}
            </div>
          </div>
        )}

        <div
          className="hud-label"
          style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '7px', display: 'flex', justifyContent: 'space-between' }}
        >
          <span>CREATED {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}</span>
          <span>UPDATED {format(new Date(item.updated_at), 'yyyy-MM-dd HH:mm')}</span>
        </div>
      </div>

      {/* ── Fixed action bar ── */}
      {deleteConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '78px',
            left: 0,
            right: 0,
            zIndex: 21,
            maxWidth: '430px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          <div style={{ border: '1px solid color-mix(in srgb, var(--accent) 40%, var(--border-subtle))', background: 'var(--bg-elevated)', borderRadius: '1rem', padding: '10px' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '8px' }}>
              Confirm delete this asset?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="md" style={{ flex: 1 }} onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="md" style={{ flex: 1 }} onClick={handleDelete}>
                Confirm delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          maxWidth: '430px',
          margin: '0 auto',
          padding: '10px 16px',
          background: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
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
          Edit asset
        </Button>
        <Button
          variant="ghost"
          onClick={() => setDeleteConfirmOpen(true)}
          size="lg"
          className="ui-button--icon ui-button--quiet-danger"
          aria-label="Delete asset"
          title="Delete asset"
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              d="M6 7h12M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9.5 7V5a1 1 0 011-1h3a1 1 0 011 1v2"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}

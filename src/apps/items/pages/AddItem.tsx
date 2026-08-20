import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import { format } from 'date-fns';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';
import TagInput from '../components/TagInput';
import ExtraCostEditor from '../components/ExtraCostEditor';
import type { ExtraCostDetail } from '../utils/extraCostDetails';
import { getExtraCostsTotal, serializeExtraCostDetails } from '../utils/extraCostDetails';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
        paddingBottom: '7px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ width: '2px', height: '10px', background: 'var(--accent)' }} />
      <span
        className="font-display"
        style={{ fontSize: '8px', letterSpacing: '0.18em', fontWeight: 600, color: 'var(--text-secondary)' }}
      >
        {children}
      </span>
    </div>
  );
}

function FormSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        padding: '0.85rem',
        position: 'relative',
        overflow: 'visible',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function AddItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagsOpen, setTagsOpen] = useState(false);
  const [extraCostDetails, setExtraCostDetails] = useState<ExtraCostDetail[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    tags: [] as string[],
    buy_date: format(new Date(), 'yyyy-MM-dd'),
    buy_price: '',
    sell_date: '',
    sell_price: '',
    purchase_source: '',
    status: 'owned',
    warranty_expire_date: '',
    note: '',
    daily_burn: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.buy_date) newErrors.buy_date = 'Buy date is required';
    if (!formData.buy_price || parseFloat(formData.buy_price) <= 0) newErrors.buy_price = 'Must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const extraCostTotal = getExtraCostsTotal(extraCostDetails);
      const normalizedExtraCosts = serializeExtraCostDetails(extraCostDetails);
      const { error } = await supabase.from('Pantagon_items').insert([{
        name: formData.name.trim(),
        tags: formData.tags,
        buy_date: formData.buy_date,
        buy_price: parseFloat(formData.buy_price),
        extra_cost: extraCostTotal,
        extra_cost_details: normalizedExtraCosts,
        purchase_source: formData.purchase_source.trim() || null,
        status: formData.status,
        warranty_expire_date: formData.warranty_expire_date || null,
        note: formData.note.trim() || null,
        daily_burn: formData.daily_burn,
        sell_date: formData.status === 'sold' && formData.sell_date ? formData.sell_date : null,
        sell_price: formData.status === 'sold' && formData.sell_price ? parseFloat(formData.sell_price) : null,
      }]).select().single();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingTop: '8px', paddingBottom: '80px', animation: 'slide-up 0.4s ease both' }}>

      {/* Page header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ height: '1px', width: '14px', background: 'var(--accent)' }} />
          <span className="hud-label" style={{ fontSize: '7px', color: 'var(--accent)', letterSpacing: '0.16em' }}>
            New record
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1
            className="font-display"
            style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.01em', color: 'var(--text-primary)', margin: 0 }}
          >
            Register asset
          </h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            CANCEL
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Basic Info */}
          <FormSection style={{ zIndex: tagsOpen ? 20 : 1 }}>
            <SectionHeader>IDENTIFICATION</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <Input
                label="ASSET NAME *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="e.g., iPhone 15 Pro Max"
              />
              <div>
                <label className="hud-label" style={{ display: 'block', marginBottom: '6px' }}>TAGS</label>
                <TagInput
                  value={formData.tags}
                  onChange={tags => setFormData(prev => ({ ...prev, tags }))}
                  placeholder="Select or type tags..."
                  onOpenChange={setTagsOpen}
                />
              </div>
              <Select
                label="STATUS *"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'owned', label: 'OWNED' },
                  { value: 'sold', label: 'SOLD' },
                ]}
              />
            </div>
          </FormSection>

          {/* Purchase Info */}
          <FormSection style={{ zIndex: 1 }}>
            <SectionHeader>ACQUISITION DATA</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <Input
                label="BUY DATE *"
                name="buy_date"
                type="date"
                value={formData.buy_date}
                onChange={handleChange}
                error={errors.buy_date}
              />
              <Input
                label="BUY PRICE ฿ *"
                name="buy_price"
                type="number"
                step="0.01"
                value={formData.buy_price}
                onChange={handleChange}
                error={errors.buy_price}
                placeholder="0.00"
              />
              <Input
                label="SOURCE"
                name="purchase_source"
                value={formData.purchase_source}
                onChange={handleChange}
                placeholder="e.g., Apple Store"
              />
              <Input
                label="WARRANTY EXP."
                name="warranty_expire_date"
                type="date"
                value={formData.warranty_expire_date}
                onChange={handleChange}
              />

              {/* Daily burn toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, daily_burn: !prev.daily_burn }))}
                  style={{
                    width: '32px',
                    height: '18px',
                    borderRadius: '9px',
                    background: formData.daily_burn ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                    border: `1px solid ${formData.daily_burn ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: formData.daily_burn ? '14px' : '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: formData.daily_burn ? 'var(--accent)' : 'var(--text-dim)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </button>
                <span className="hud-label" style={{ fontSize: '8px' }}>
                  Track daily burn
                </span>
              </div>
            </div>
          </FormSection>

          <FormSection>
            <SectionHeader>EXTRA COST DETAILS</SectionHeader>
            <ExtraCostEditor
              value={extraCostDetails}
              onChange={setExtraCostDetails}
            />
          </FormSection>

          {/* Sell Info (conditional) */}
          {formData.status === 'sold' && (
            <FormSection>
              <SectionHeader>DIVESTMENT DATA</SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                <Input
                  label="SELL DATE"
                  name="sell_date"
                  type="date"
                  value={formData.sell_date}
                  onChange={handleChange}
                />
                <Input
                  label="SELL PRICE ฿"
                  name="sell_price"
                  type="number"
                  step="0.01"
                  value={formData.sell_price}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </FormSection>
          )}

          {/* Notes */}
          <FormSection>
            <SectionHeader>NOTES</SectionHeader>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '2px', background: 'var(--accent)' }} />
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                placeholder="Additional notes about this asset..."
                style={{
                  width: '100%',
                  paddingLeft: '12px',
                  paddingRight: '10px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  letterSpacing: '0.02em',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                  borderRadius: '0 0.85rem 0.85rem 0',
                }}
              />
            </div>
          </FormSection>
        </div>
      </form>

      {/* Fixed submit bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: '430px',
          margin: '0 auto',
          padding: '8px 12px',
          background: 'color-mix(in srgb, var(--bg-primary) 90%, transparent)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '8px',
          zIndex: 20,
        }}
      >
        <Button
          type="submit"
          variant="primary"
          size="md"
          style={{ flex: 1 }}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Registering...' : 'Register asset'}
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => navigate('/')}
          style={{ minWidth: '80px' }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

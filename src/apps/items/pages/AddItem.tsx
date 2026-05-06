import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/utils/supabase';
import { format } from 'date-fns';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';
import TagInput from '../components/TagInput';

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '14px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,43,43,0.12)',
      }}
    >
      <div style={{ width: '2px', height: '12px', background: 'var(--neon-red)', boxShadow: '0 0 6px var(--neon-red)' }} />
      <span
        className="font-display"
        style={{ fontSize: '9px', letterSpacing: '0.2em', fontWeight: 600, color: 'var(--text-secondary)' }}
      >
        {children}
      </span>
    </div>
  );
}

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,43,43,0.12)',
        borderTop: '1px solid rgba(255,43,43,0.35)',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, var(--neon-red), transparent)', animation: 'energy-line 7s ease-in-out infinite' }} />
      {children}
    </div>
  );
}

export default function AddItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    tags: [] as string[],
    buy_date: format(new Date(), 'yyyy-MM-dd'),
    buy_price: '',
    extra_cost: '0',
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
      const { error } = await supabase.from('Pantagon_items').insert([{
        name: formData.name.trim(),
        tags: formData.tags,
        buy_date: formData.buy_date,
        buy_price: parseFloat(formData.buy_price),
        extra_cost: parseFloat(formData.extra_cost) || 0,
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
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ height: '1px', width: '16px', background: 'var(--neon-red)', boxShadow: '0 0 6px var(--neon-red)' }} />
          <span className="hud-label" style={{ fontSize: '8px', color: 'var(--neon-red)', letterSpacing: '0.25em' }}>
            NEW RECORD
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1
            className="font-display"
            style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', margin: 0 }}
          >
            REGISTER ASSET
          </h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            CANCEL
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Basic Info */}
          <FormSection>
            <SectionHeader>IDENTIFICATION</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
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
          <FormSection>
            <SectionHeader>ACQUISITION DATA</SectionHeader>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                label="EXTRA COST ฿"
                name="extra_cost"
                type="number"
                step="0.01"
                value={formData.extra_cost}
                onChange={handleChange}
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
                    background: formData.daily_burn ? 'rgba(255,43,43,0.3)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${formData.daily_burn ? 'rgba(255,43,43,0.6)' : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: formData.daily_burn ? '0 0 8px rgba(255,43,43,0.3)' : 'none',
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
                      background: formData.daily_burn ? 'var(--neon-red)' : 'rgba(255,255,255,0.3)',
                      boxShadow: formData.daily_burn ? '0 0 6px var(--neon-red)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </button>
                <span className="hud-label" style={{ fontSize: '8px' }}>
                  TRACK DAILY BURN
                </span>
              </div>
            </div>
          </FormSection>

          {/* Sell Info (conditional) */}
          {formData.status === 'sold' && (
            <FormSection>
              <SectionHeader>DIVESTMENT DATA</SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '2px', background: 'rgba(255,43,43,0.4)' }} />
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={4}
                placeholder="Additional notes about this asset..."
                style={{
                  width: '100%',
                  paddingLeft: '14px',
                  paddingRight: '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  background: 'rgba(8,8,8,0.9)',
                  border: '1px solid rgba(255,43,43,0.15)',
                  borderLeft: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-tech)',
                  fontSize: '14px',
                  letterSpacing: '0.02em',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  (e.currentTarget).style.borderColor = 'rgba(255,43,43,0.4)';
                  (e.currentTarget).style.boxShadow = '0 0 12px rgba(255,43,43,0.08)';
                }}
                onBlur={e => {
                  (e.currentTarget).style.borderColor = 'rgba(255,43,43,0.15)';
                  (e.currentTarget).style.boxShadow = 'none';
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
          maxWidth: '480px',
          margin: '0 auto',
          padding: '10px 16px',
          background: 'rgba(5,5,5,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,43,43,0.2)',
          display: 'flex',
          gap: '8px',
          zIndex: 20,
        }}
      >
        <Button
          type="submit"
          variant="primary"
          size="lg"
          style={{ flex: 1 }}
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'REGISTERING...' : 'REGISTER ASSET'}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate('/')}
          style={{ minWidth: '80px' }}
        >
          CANCEL
        </Button>
      </div>
    </div>
  );
}

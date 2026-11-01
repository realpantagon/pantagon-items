import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { getCachedItems, type ItemInput } from '../../../api/items/api';
import type { PantagonItem } from '../../../api/items/types';
import ActionBar from '../../../shared/components/ActionBar';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import StarRating from '../../../shared/components/StarRating';
import TagInput from './TagInput';
import ExtraCostEditor from './ExtraCostEditor';
import type { ExtraCostDetail } from '../utils/extraCostDetails';
import {
  getExtraCostsTotal,
  parseExtraCostDetails,
  parseLegacyExtraCostsFromNote,
  serializeExtraCostDetails,
  stripLegacyExtraCostsFromNote,
} from '../utils/extraCostDetails';

interface ItemFormProps {
  title: string;
  submitLabel: string;
  initial?: PantagonItem;
  onSubmit: (input: ItemInput) => Promise<void>;
}

function initialExtraCosts(item?: PantagonItem): ExtraCostDetail[] {
  if (!item) return [];
  const fromDb = parseExtraCostDetails(item.extra_cost_details);
  if (fromDb.length > 0) return fromDb;
  const fromNote = parseLegacyExtraCostsFromNote(item.note);
  if (fromNote.length > 0) return fromNote;
  // Older records only carry a lump sum; surface it as one editable row
  return item.extra_cost > 0
    ? [{ id: 'legacy-extra-cost', label: 'Existing extra cost', amount: item.extra_cost, date: item.buy_date }]
    : [];
}

function AutoGrowTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={3} className="ui-textarea" {...props} />;
}

export default function ItemForm({ title, submitLabel, initial, onSubmit }: ItemFormProps) {
  const formId = useId();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [extraCostDetails, setExtraCostDetails] = useState<ExtraCostDetail[]>(() => initialExtraCosts(initial));
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '',
    tags: initial?.tags ?? [],
    status: initial?.status ?? ('owned' as 'owned' | 'sold'),
    buy_date: initial?.buy_date ?? format(new Date(), 'yyyy-MM-dd'),
    buy_price: initial ? String(initial.buy_price) : '',
    purchase_source: initial?.purchase_source ?? '',
    warranty_expire_date: initial?.warranty_expire_date ?? '',
    daily_burn: initial ? initial.daily_burn !== false : true,
    rating: initial?.rating ?? null as number | null,
    sell_date: initial?.sell_date ?? '',
    sell_price: initial?.sell_price != null ? String(initial.sell_price) : '',
    reason_to_sell: initial?.reason_to_sell ?? '',
    note: stripLegacyExtraCostsFromNote(initial?.note ?? ''),
  }));

  // Suggest stores already used on other items
  const knownSources = useMemo(
    () => Array.from(new Set((getCachedItems() ?? []).map(i => i.purchase_source?.trim()).filter(Boolean))) as string[],
    [],
  );

  const markSold = () => {
    // Most items are marked sold on the day they go, so prefill today
    setForm(prev => ({ ...prev, status: 'sold', sell_date: prev.sell_date || format(new Date(), 'yyyy-MM-dd') }));
  };

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    set(e.target.name as keyof typeof form, e.target.value as never);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Enter a name';
    if (!form.buy_date) next.buy_date = 'Pick the purchase date';
    if (!form.buy_price || parseFloat(form.buy_price) <= 0) next.buy_price = 'Enter a price above 0';
    if (form.status === 'sold') {
      if (!form.sell_date) next.sell_date = 'Pick the sale date';
      else if (form.sell_date < form.buy_date) next.sell_date = 'Sale date is before the purchase date';
      if (form.sell_price === '' || parseFloat(form.sell_price) < 0) next.sell_price = 'Enter the sale price';
    }
    setErrors(next);
    const firstInvalid = Object.keys(next)[0];
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
    return !firstInvalid;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    setSubmitError(null);
    const isSold = form.status === 'sold';
    try {
      await onSubmit({
        name: form.name.trim(),
        tags: form.tags,
        status: form.status,
        buy_date: form.buy_date,
        buy_price: parseFloat(form.buy_price),
        extra_cost: getExtraCostsTotal(serializeExtraCostDetails(extraCostDetails)),
        extra_cost_details: serializeExtraCostDetails(extraCostDetails),
        purchase_source: form.purchase_source.trim() || null,
        warranty_expire_date: form.warranty_expire_date || null,
        daily_burn: form.daily_burn,
        rating: form.rating,
        sell_date: isSold ? form.sell_date : null,
        sell_price: isSold ? parseFloat(form.sell_price) : null,
        reason_to_sell: isSold ? form.reason_to_sell.trim() || null : null,
        note: form.note.trim() || null,
      });
    } catch (error) {
      console.error('Error saving item:', error);
      setSubmitError('Could not save. Your changes are still here, try again.');
      setSaving(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate style={{ animation: 'fade-up 0.3s var(--ease-out) both' }}>
      <h1 style={{ margin: '6px 0 18px', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <section className="group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. iPhone 15 Pro Max"
            autoCapitalize="words"
            enterKeyHint="next"
          />
          <div>
            <span className="ui-field-label">Status</span>
            <div className="segmented" role="group" aria-label="Status">
              <button type="button" aria-pressed={form.status === 'owned'} onClick={() => set('status', 'owned')}>Owned</button>
              <button type="button" aria-pressed={form.status === 'sold'} onClick={markSold}>Sold</button>
            </div>
          </div>
          <div>
            <span className="ui-field-label">Rating</span>
            <StarRating value={form.rating} onChange={star => set('rating', form.rating === star ? null : star)} size={26} />
          </div>
        </section>

        <section className="group">
          <h2 className="group__title">Tags</h2>
          <TagInput value={form.tags} onChange={tags => set('tags', tags)} />
        </section>

        <section className="group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 className="group__title" style={{ margin: 0 }}>Purchase</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input
              label="Price"
              name="buy_price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={form.buy_price}
              onChange={handleChange}
              error={errors.buy_price}
              placeholder="0"
              suffix="฿"
              className="num"
            />
            <Input label="Date" name="buy_date" type="date" value={form.buy_date} onChange={handleChange} error={errors.buy_date} />
          </div>
          <Input
            label="Bought from"
            name="purchase_source"
            value={form.purchase_source}
            onChange={handleChange}
            placeholder="e.g. Shopee, Marketplace"
            list="known-sources"
            autoCapitalize="words"
          />
          <datalist id="known-sources">
            {knownSources.map(source => <option key={source} value={source} />)}
          </datalist>
          <Input label="Warranty until" name="warranty_expire_date" type="date" value={form.warranty_expire_date} onChange={handleChange} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Count in daily burn</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Spread its cost over the days you own it</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.daily_burn}
              aria-label="Count in daily burn"
              className="switch"
              onClick={() => set('daily_burn', !form.daily_burn)}
            />
          </div>
        </section>

        <section className="group">
          <h2 className="group__title">Extra costs</h2>
          <ExtraCostEditor value={extraCostDetails} onChange={setExtraCostDetails} />
        </section>

        {form.status === 'sold' && (
          <section className="group" style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fade-up 0.25s var(--ease-out) both' }}>
            <h2 className="group__title" style={{ margin: 0 }}>Sale</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input
                label="Sold for"
                name="sell_price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.sell_price}
                onChange={handleChange}
                error={errors.sell_price}
                placeholder="0"
                suffix="฿"
                className="num"
              />
              <Input label="Date" name="sell_date" type="date" value={form.sell_date} onChange={handleChange} error={errors.sell_date} />
            </div>
            <div>
              <label htmlFor="reason_to_sell" className="ui-field-label">Why sell?</label>
              <AutoGrowTextarea id="reason_to_sell" name="reason_to_sell" value={form.reason_to_sell} onChange={handleChange} placeholder="e.g. upgraded, made a profit" />
            </div>
          </section>
        )}

        <section className="group">
          <label htmlFor="note" className="group__title" style={{ display: 'block' }}>Notes</label>
          <AutoGrowTextarea id="note" name="note" value={form.note} onChange={handleChange} placeholder="Specs, condition, receipts…" />
        </section>
      </div>

      <ActionBar stacked>
        {submitError && <p role="alert" className="ui-error" style={{ margin: 0, textAlign: 'center' }}>{submitError}</p>}
        <Button type="submit" form={formId} variant="primary" size="lg" disabled={saving} style={{ width: '100%' }}>
          {saving ? <span className="spinner" /> : submitLabel}
        </Button>
      </ActionBar>
    </form>
  );
}

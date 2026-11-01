import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../../api/items/calculations';
import type { ExtraCostDetail } from '../utils/extraCostDetails';
import { sortExtraCostDetails } from '../utils/extraCostDetails';

interface ExtraCostEditorProps {
  value: ExtraCostDetail[];
  onChange: (rows: ExtraCostDetail[]) => void;
}

function createRow(): ExtraCostDetail {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
  };
}

export default function ExtraCostEditor({ value, onChange }: ExtraCostEditorProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [confirmDeleteRowId, setConfirmDeleteRowId] = useState<string | null>(null);

  // Keep the row being edited in place so it doesn't jump while its date changes
  const sortedRows = useMemo(() => (editingRowId ? value : sortExtraCostDetails(value)), [value, editingRowId]);
  const total = useMemo(
    () => value.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [value],
  );

  const addRow = () => {
    const newRow = createRow();
    onChange([newRow, ...value]);
    setEditingRowId(newRow.id);
    setConfirmDeleteRowId(null);
  };

  const updateRow = (id: string, patch: Partial<ExtraCostDetail>) => {
    onChange(value.map(row => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    onChange(value.filter(row => row.id !== id));
    if (editingRowId === id) setEditingRowId(null);
    if (confirmDeleteRowId === id) setConfirmDeleteRowId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button type="button" onClick={addRow} className="ui-button ui-button--secondary ui-button--md" style={{ width: '100%' }}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        เพิ่มรายการค่าใช้จ่าย
      </button>

      {value.length > 0 && (
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '14px', overflow: 'hidden' }}>
          {sortedRows.map(row => {
            const isEditing = editingRowId === row.id;
            const isDeleteConfirm = confirmDeleteRowId === row.id;

            if (isEditing) {
              return (
                <div key={row.id} className="xcost-row xcost-row--editing">
                  <input
                    value={row.label}
                    onChange={e => updateRow(row.id, { label: e.target.value })}
                    placeholder="รายการ เช่น เติมน้ำมัน"
                    aria-label="รายการ"
                    className="ui-input xcost-input xcost-label"
                    autoFocus
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={row.amount || ''}
                    onChange={e => updateRow(row.id, { amount: Number(e.target.value) || 0 })}
                    placeholder="ราคา ฿"
                    aria-label="ราคา"
                    className="ui-input xcost-input xcost-input--amount xcost-amount num"
                  />
                  {/* Native picker underneath, our own "1 Nov 2026" label on top: iOS renders the
                      native value with the device calendar ("1 Nov BE 2569") and wraps it in a narrow box */}
                  <label className="xcost-input xcost-date xcost-date-field">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                      <path d="M3.5 10h17M8 3v4M16 3v4" />
                    </svg>
                    <span className="num">{row.date ? format(parseISO(row.date), 'd MMM yyyy') : 'วันที่'}</span>
                    <input
                      type="date"
                      value={row.date}
                      onChange={e => e.target.value && updateRow(row.id, { date: e.target.value })}
                      aria-label="วันที่"
                      className="xcost-date-field__native"
                    />
                  </label>
                  <div className="xcost-actions">
                    <button type="button" className="ui-button ui-button--ghost ui-button--sm" onClick={() => removeRow(row.id)}>
                      ลบ
                    </button>
                    <button type="button" className="ui-button ui-button--primary ui-button--sm" style={{ minWidth: '88px' }} onClick={() => setEditingRowId(null)}>
                      เสร็จ
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={row.id} className="xcost-row">
                <div className="xcost-label xcost-text xcost-text--label">{row.label || 'ไม่มีชื่อรายการ'}</div>
                <div className="xcost-amount xcost-text xcost-text--amount num">{formatCurrency(row.amount || 0)}</div>
                <div className="xcost-date xcost-text xcost-text--date num">{row.date ? format(parseISO(row.date), 'd MMM yyyy') : '—'}</div>
                <div className="xcost-actions">
                  {isDeleteConfirm ? (
                    <>
                      <button type="button" className="ui-button ui-button--ghost ui-button--sm" onClick={() => setConfirmDeleteRowId(null)}>
                        ยกเลิก
                      </button>
                      <button type="button" className="ui-button ui-button--danger ui-button--sm" onClick={() => removeRow(row.id)}>
                        ยืนยันลบ
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="ui-button ui-button--ghost ui-button--sm" onClick={() => setConfirmDeleteRowId(row.id)} aria-label={`ลบ ${row.label}`}>
                        ลบ
                      </button>
                      <button
                        type="button"
                        className="ui-button ui-button--secondary ui-button--sm"
                        onClick={() => {
                          setConfirmDeleteRowId(null);
                          setEditingRowId(row.id);
                        }}
                      >
                        แก้ไข
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 2px' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          รวมค่าใช้จ่ายเพิ่มเติม{value.length > 0 && ` · ${value.length} รายการ`}
        </span>
        <span className="num" style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem' }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

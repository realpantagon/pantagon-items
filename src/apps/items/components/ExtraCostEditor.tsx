import { useMemo, useState } from 'react';
import { format } from 'date-fns';
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

  const sortedRows = useMemo(() => sortExtraCostDetails(value), [value]);

  const total = useMemo(
    () => value.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0),
    [value],
  );

  const addRow = () => {
    const newRow = createRow();
    onChange([...value, newRow]);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="hud-label" style={{ fontSize: '0.66rem' }}>รายการค่าใช้จ่ายเพิ่มเติม</span>
        <button
          type="button"
          onClick={addRow}
          className="ui-button ui-button--secondary ui-button--sm"
          aria-label="เพิ่มรายการค่าใช้จ่าย"
          style={{ minWidth: '38px', width: '38px', height: '38px', padding: 0, fontSize: '1.1rem', lineHeight: 1 }}
        >
          +
        </button>
      </div>

      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '1rem', overflow: 'hidden' }}>
        {value.length === 0 ? (
          <div style={{ padding: '14px 12px', color: 'var(--text-dim)', fontSize: '0.86rem' }}>กด + เพื่อเพิ่มรายการ</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedRows.map((row, idx) => {
              const isEditing = editingRowId === row.id;
              const isDeleteConfirm = confirmDeleteRowId === row.id;

              return (
                <div
                  key={row.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(190px, 1fr) 118px 148px 74px 88px',
                    gap: '8px',
                    padding: '10px 12px',
                    borderBottom: idx === sortedRows.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                    alignItems: 'center',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {isEditing ? (
                    <input
                      value={row.label}
                      onChange={e => updateRow(row.id, { label: e.target.value })}
                      placeholder="รายการค่าใช้จ่าย"
                      className="ui-input"
                      style={{ border: '1px solid var(--border-subtle)', borderRadius: '0.8rem', background: 'var(--bg-elevated)' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.label || '-'}
                    </div>
                  )}

                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount || ''}
                      onChange={e => updateRow(row.id, { amount: Number(e.target.value) || 0 })}
                      placeholder="ราคา"
                      className="ui-input"
                      style={{ border: '1px solid var(--border-subtle)', borderRadius: '0.8rem', background: 'var(--bg-elevated)' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>{formatCurrency(row.amount || 0)}</div>
                  )}

                  {isEditing ? (
                    <input
                      type="date"
                      value={row.date}
                      onChange={e => updateRow(row.id, { date: e.target.value })}
                      className="ui-input"
                      style={{ border: '1px solid var(--border-subtle)', borderRadius: '0.8rem', background: 'var(--bg-elevated)' }}
                    />
                  ) : (
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center' }}>{row.date || '-'}</div>
                  )}

                  {isDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteRowId(null)}
                      className="ui-button ui-button--ghost ui-button--sm"
                    >
                      ยกเลิก
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteRowId(null);
                        setEditingRowId(isEditing ? null : row.id);
                      }}
                      className="ui-button ui-button--ghost ui-button--sm"
                    >
                      {isEditing ? 'จบ' : 'แก้ไข'}
                    </button>
                  )}

                  {isDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="ui-button ui-button--danger ui-button--sm"
                    >
                      ยืนยันลบ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteRowId(row.id)}
                      className="ui-button ui-button--ghost ui-button--sm"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="hud-label" style={{ fontSize: '0.66rem' }}>Extra cost total</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

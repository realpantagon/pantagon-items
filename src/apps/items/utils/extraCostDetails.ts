export interface ExtraCostDetail {
  id: string;
  label: string;
  amount: number;
  date: string;
}

const EXTRA_COSTS_OPEN = '[extra-costs-json]';
const EXTRA_COSTS_CLOSE = '[/extra-costs-json]';

function toNumber(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function normalizeExtraCostEntry(raw: unknown): ExtraCostDetail | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  const label = toString(candidate.label).trim();
  const amount = toNumber(candidate.amount);
  const date = toString(candidate.date).trim();

  if (!label || amount <= 0) return null;

  return {
    id: toString(candidate.id).trim() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    amount,
    date,
  };
}

export function sortExtraCostDetails(entries: ExtraCostDetail[]): ExtraCostDetail[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      // Rows without a date sink to the bottom instead of sorting as epoch 0
      if (!a.entry.date && !b.entry.date) return a.index - b.index;
      if (!a.entry.date) return 1;
      if (!b.entry.date) return -1;
      if (a.entry.date === b.entry.date) return a.index - b.index;
      return a.entry.date < b.entry.date ? 1 : -1;
    })
    .map(({ entry }) => entry);
}

export function parseExtraCostDetails(raw: unknown): ExtraCostDetail[] {
  if (!Array.isArray(raw)) return [];

  return sortExtraCostDetails(
    raw
      .map(normalizeExtraCostEntry)
      .filter((entry): entry is ExtraCostDetail => Boolean(entry)),
  );
}

export function serializeExtraCostDetails(entries: ExtraCostDetail[]): ExtraCostDetail[] {
  return sortExtraCostDetails(
    entries
      .map(normalizeExtraCostEntry)
      .filter((entry): entry is ExtraCostDetail => Boolean(entry)),
  );
}

function extractLegacyJson(note: string): string | null {
  const start = note.indexOf(EXTRA_COSTS_OPEN);
  const end = note.indexOf(EXTRA_COSTS_CLOSE);

  if (start === -1 || end === -1 || end < start) {
    return null;
  }

  return note.slice(start + EXTRA_COSTS_OPEN.length, end).trim();
}

export function parseLegacyExtraCostsFromNote(note: string | null | undefined): ExtraCostDetail[] {
  const source = (note || '').trim();
  if (!source) return [];

  const rawJson = extractLegacyJson(source);
  if (!rawJson) return [];

  try {
    const parsed = JSON.parse(rawJson);
    return parseExtraCostDetails(parsed);
  } catch {
    return [];
  }
}

export function stripLegacyExtraCostsFromNote(note: string | null | undefined): string {
  const source = (note || '').trim();
  if (!source) return '';

  return source
    .replace(/\s*\[extra-costs-json\][\s\S]*?\[\/extra-costs-json\]\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getExtraCostsTotal(extraCosts: ExtraCostDetail[]): number {
  return extraCosts.reduce((sum, row) => sum + (Number.isFinite(row.amount) ? row.amount : 0), 0);
}

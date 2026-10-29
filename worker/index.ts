import { Hono } from 'hono';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

interface ItemRow {
  id: string;
  name: string;
  tags: string;
  buy_date: string;
  buy_price: number;
  extra_cost: number;
  extra_cost_details: string;
  sell_date: string | null;
  sell_price: number | null;
  status: 'owned' | 'sold';
  purchase_source: string | null;
  warranty_expire_date: string | null;
  reason_to_sell: string | null;
  note: string | null;
  daily_burn: number;
  rating: number | null;
  created_at: string;
  updated_at: string;
}

// Columns a client may write; id and timestamps are owned by the server
const WRITABLE = [
  'name', 'tags', 'buy_date', 'buy_price', 'extra_cost', 'extra_cost_details',
  'sell_date', 'sell_price', 'status', 'purchase_source', 'warranty_expire_date',
  'reason_to_sell', 'note', 'daily_burn', 'rating',
] as const;

type Writable = (typeof WRITABLE)[number];

function parseJsonArray(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// D1 stores JSON as TEXT and booleans as 0/1, so map rows back to the client shape
function toItem(row: ItemRow) {
  return {
    ...row,
    tags: parseJsonArray(row.tags),
    extra_cost_details: parseJsonArray(row.extra_cost_details),
    daily_burn: row.daily_burn === 1,
  };
}

function toColumn(key: Writable, value: unknown) {
  if (key === 'tags' || key === 'extra_cost_details') return JSON.stringify(Array.isArray(value) ? value : []);
  if (key === 'daily_burn') return value ? 1 : 0;
  return value ?? null;
}

function pickWritable(body: Record<string, unknown>) {
  return WRITABLE.filter(key => key in body).map(key => [key, toColumn(key, body[key])] as const);
}

const now = () => new Date().toISOString();

const app = new Hono<{ Bindings: Env }>().basePath('/api');

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message }, 500);
});

app.get('/items', async c => {
  const { results } = await c.env.DB
    .prepare('SELECT * FROM items ORDER BY buy_date DESC, created_at DESC')
    .all<ItemRow>();
  return c.json(results.map(toItem));
});

app.get('/items/:id', async c => {
  const row = await c.env.DB.prepare('SELECT * FROM items WHERE id = ?').bind(c.req.param('id')).first<ItemRow>();
  return row ? c.json(toItem(row)) : c.json({ error: 'Not found' }, 404);
});

app.post('/items', async c => {
  const fields = pickWritable(await c.req.json());
  if (!fields.some(([key]) => key === 'name')) return c.json({ error: 'name is required' }, 400);

  const stamp = now();
  const columns = ['id', ...fields.map(([key]) => key), 'created_at', 'updated_at'];
  const values = [crypto.randomUUID(), ...fields.map(([, value]) => value), stamp, stamp];

  const row = await c.env.DB
    .prepare(`INSERT INTO items (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) RETURNING *`)
    .bind(...values)
    .first<ItemRow>();
  return c.json(toItem(row!), 201);
});

app.patch('/items/:id', async c => {
  const fields = pickWritable(await c.req.json());
  const assignments = [...fields.map(([key]) => `${key} = ?`), 'updated_at = ?'];

  const row = await c.env.DB
    .prepare(`UPDATE items SET ${assignments.join(', ')} WHERE id = ? RETURNING *`)
    .bind(...fields.map(([, value]) => value), now(), c.req.param('id'))
    .first<ItemRow>();
  return row ? c.json(toItem(row)) : c.json({ error: 'Not found' }, 404);
});

app.delete('/items/:id', async c => {
  const result = await c.env.DB.prepare('DELETE FROM items WHERE id = ?').bind(c.req.param('id')).run();
  return result.meta.changes ? c.body(null, 204) : c.json({ error: 'Not found' }, 404);
});

app.notFound(c => c.json({ error: 'Not found' }, 404));

export default {
  fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) return app.fetch(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

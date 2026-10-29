import type { PantagonItem } from './types';

export type ItemInput = Partial<Omit<PantagonItem, 'id' | 'created_at' | 'updated_at'>>;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// Last list we saw, so going back to the dashboard paints instantly while it revalidates
let cachedItems: PantagonItem[] | null = null;

export function getCachedItems(): PantagonItem[] | null {
  return cachedItems;
}

export function getCachedItem(id: string): PantagonItem | null {
  return cachedItems?.find(item => item.id === id) ?? null;
}

function patchCache(item: PantagonItem | null, removeId?: string) {
  if (!cachedItems) return;
  if (removeId) cachedItems = cachedItems.filter(i => i.id !== removeId);
  if (item) {
    const exists = cachedItems.some(i => i.id === item.id);
    cachedItems = exists ? cachedItems.map(i => (i.id === item.id ? item : i)) : [item, ...cachedItems];
  }
}

export async function fetchItems(): Promise<PantagonItem[]> {
  cachedItems = await request<PantagonItem[]>('/items');
  return cachedItems;
}

export function fetchItemById(id: string): Promise<PantagonItem> {
  return request(`/items/${encodeURIComponent(id)}`);
}

export async function createItem(item: ItemInput): Promise<PantagonItem> {
  const created = await request<PantagonItem>('/items', { method: 'POST', body: JSON.stringify(item) });
  patchCache(created);
  return created;
}

export async function updateItem(id: string, updates: ItemInput): Promise<PantagonItem> {
  const updated = await request<PantagonItem>(`/items/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  patchCache(updated);
  return updated;
}

export async function deleteItem(id: string): Promise<void> {
  await request(`/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
  patchCache(null, id);
}

export async function fetchAllTags(): Promise<string[]> {
  const items = cachedItems ?? await fetchItems();
  return Array.from(new Set(items.flatMap(item => item.tags ?? []).filter(Boolean))).sort();
}

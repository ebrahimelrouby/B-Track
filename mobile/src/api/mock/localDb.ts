import { MMKV } from 'react-native-mmkv';

const db = new MMKV({ id: 'btrack-mock-db' });

export const localDb = {
  get<T>(key: string): T | null {
    const val = db.getString(key);
    return val ? (JSON.parse(val) as T) : null;
  },

  set<T>(key: string, value: T): void {
    db.set(key, JSON.stringify(value));
  },

  delete(key: string): void {
    db.delete(key);
  },

  getList<T>(key: string): T[] {
    return this.get<T[]>(key) ?? [];
  },

  // Append an item to a stored array
  append<T extends { id: string }>(key: string, item: T): T {
    const list = this.getList<T>(key);
    list.push(item);
    this.set(key, list);
    return item;
  },

  // Replace one item by id inside a stored array
  update<T extends { id: string }>(key: string, id: string, patch: Partial<T>): T | null {
    const list = this.getList<T>(key);
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch };
    this.set(key, list);
    return list[idx];
  },

  // Remove one item by id
  remove<T extends { id: string }>(key: string, id: string): void {
    const list = this.getList<T>(key);
    this.set(key, list.filter((x) => x.id !== id));
  },
};

// Stable uuid-like ID from timestamp + random
export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

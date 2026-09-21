type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memory = new Map<string, CacheEntry<unknown>>();

export function getClientCache<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setClientCache<T>(key: string, value: T, ttlMs = 300_000) {
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function invalidateClientCache(key?: string) {
  if (key) {
    memory.delete(key);
    return;
  }
  memory.clear();
}

export async function fetchWithClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 300_000,
): Promise<T> {
  const cached = getClientCache<T>(key);
  if (cached !== null) return cached;

  const value = await fetcher();
  setClientCache(key, value, ttlMs);
  return value;
}

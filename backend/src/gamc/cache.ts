export interface CacheEntry {
  body: Buffer;
  contentType: string;
  expiresAt: number;
}

export class WmsCache {
  private readonly entries = new Map<string, CacheEntry>();

  get(key: string): CacheEntry | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: Omit<CacheEntry, "expiresAt">, ttlMs: number): void {
    this.entries.set(key, { ...entry, expiresAt: Date.now() + ttlMs });
  }
}

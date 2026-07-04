type BrowserStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  isPersistent(): boolean;
  subscribe(listener: () => void): () => void;
}

/** Keeps the current session usable when browser storage is blocked or full. */
export function createStorageAdapter(
  openStorage: () => BrowserStorage,
): StorageAdapter {
  const memory = new Map<string, string>();
  const listeners = new Set<() => void>();
  let persistent = true;

  function attempt<T>(
    operation: (storage: BrowserStorage) => T,
    fallback: () => T,
  ): T {
    if (persistent) {
      try {
        return operation(openStorage());
      } catch {
        persistent = false;
        listeners.forEach((listener) => listener());
      }
    }
    return fallback();
  }

  return {
    getItem(key) {
      return attempt(
        (storage) => {
          const value = storage.getItem(key);
          if (value === null) memory.delete(key);
          else memory.set(key, value);
          return value;
        },
        () => memory.get(key) ?? null,
      );
    },
    setItem(key, value) {
      memory.set(key, value);
      attempt(
        (storage) => storage.setItem(key, value),
        () => undefined,
      );
    },
    removeItem(key) {
      memory.delete(key);
      attempt(
        (storage) => storage.removeItem(key),
        () => undefined,
      );
    },
    isPersistent: () => persistent,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const browserStorage = createStorageAdapter(() => window.localStorage);

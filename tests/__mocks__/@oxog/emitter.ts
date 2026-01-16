/**
 * Mock for @oxog/emitter
 */

export type EventMap = Record<string, unknown>;

export interface Emitter<T extends EventMap> {
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void;
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  once<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void;
}

export function createEmitter<T extends EventMap>(): Emitter<T> {
  const listeners = new Map<keyof T, Set<(data: unknown) => void>>();

  return {
    on<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler as (data: unknown) => void);
      return () => this.off(event, handler);
    },

    off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void {
      listeners.get(event)?.delete(handler as (data: unknown) => void);
    },

    emit<K extends keyof T>(event: K, data: T[K]): void {
      const handlers = listeners.get(event);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(data);
          } catch {
            // Ignore errors in handlers
          }
        }
      }
    },

    once<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void {
      const wrapper = (data: T[K]) => {
        this.off(event, wrapper);
        handler(data);
      };
      return this.on(event, wrapper);
    },
  };
}

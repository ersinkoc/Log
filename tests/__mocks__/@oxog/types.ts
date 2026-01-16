/**
 * Mock for @oxog/types
 */

export interface Plugin<T = unknown> {
  name: string;
  version: string;
  install(kernel: Kernel<T>): void;
  onInit?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

export interface Kernel<T = unknown> {
  use(plugin: Plugin<T>): void;
  unregister(name: string): boolean;
  has(name: string): boolean;
  list(): Plugin<T>[];
  getContext(): T;
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export type EventMap = Record<string, unknown>;

export interface Emitter<T extends EventMap> {
  on<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void;
  off<K extends keyof T>(event: K, handler: (data: T[K]) => void): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  once<K extends keyof T>(event: K, handler: (data: T[K]) => void): () => void;
}

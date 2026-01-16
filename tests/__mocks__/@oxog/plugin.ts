/**
 * Mock for @oxog/plugin
 */

import { vi } from 'vitest';

export interface Kernel<T> {
  use(plugin: Plugin<T>): void;
  unregister(name: string): boolean;
  has(name: string): boolean;
  list(): Plugin<T>[];
  getContext(): T;
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export interface Plugin<T> {
  name: string;
  version: string;
  install(kernel: Kernel<T>): void;
  onInit?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

export function createKernel<T>(options: { context: T }): Kernel<T> {
  const plugins = new Map<string, Plugin<T>>();
  const context = options.context;

  return {
    use(plugin: Plugin<T>): void {
      plugins.set(plugin.name, plugin);
      plugin.install(this);
    },
    unregister(name: string): boolean {
      const plugin = plugins.get(name);
      if (plugin) {
        if (plugin.onDestroy) {
          plugin.onDestroy();
        }
        plugins.delete(name);
        return true;
      }
      return false;
    },
    has(name: string): boolean {
      return plugins.has(name);
    },
    list(): Plugin<T>[] {
      return Array.from(plugins.values());
    },
    getContext(): T {
      return context;
    },
    async init(): Promise<void> {
      for (const plugin of plugins.values()) {
        if (plugin.onInit) {
          await plugin.onInit();
        }
      }
    },
    async destroy(): Promise<void> {
      const pluginList = Array.from(plugins.values()).reverse();
      for (const plugin of pluginList) {
        if (plugin.onDestroy) {
          await plugin.onDestroy();
        }
      }
      plugins.clear();
    },
  };
}

export function definePlugin<T>(options: Plugin<T>): Plugin<T> {
  return options;
}

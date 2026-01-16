import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getStoredTheme(): 'light' | 'dark' | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('theme') as 'light' | 'dark' | null;
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem('theme', theme);
}

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

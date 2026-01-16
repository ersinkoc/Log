/**
 * Mock for @oxog/pigment
 */

export interface Pigment {
  red(text: string): string;
  green(text: string): string;
  blue(text: string): string;
  yellow(text: string): string;
  magenta(text: string): string;
  cyan(text: string): string;
  gray(text: string): string;
  grey(text: string): string;
  white(text: string): string;
  black(text: string): string;
  bold(text: string): string;
  dim(text: string): string;
  italic(text: string): string;
  underline(text: string): string;
  reset(text: string): string;
}

// Mock pigment that just returns the text unchanged
export const pigment: Pigment = {
  red: (text: string) => text,
  green: (text: string) => text,
  blue: (text: string) => text,
  yellow: (text: string) => text,
  magenta: (text: string) => text,
  cyan: (text: string) => text,
  gray: (text: string) => text,
  grey: (text: string) => text,
  white: (text: string) => text,
  black: (text: string) => text,
  bold: (text: string) => text,
  dim: (text: string) => text,
  italic: (text: string) => text,
  underline: (text: string) => text,
  reset: (text: string) => text,
};

export default pigment;

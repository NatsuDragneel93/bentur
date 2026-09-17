import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

// matchMedia finto: `matches` modificabile e notifica ai listener registrati
const mockMatchMedia = (initial: boolean) => {
  let listeners: (() => void)[] = [];
  const media = {
    matches: initial,
    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
    removeEventListener: (_: string, listener: () => void) => { listeners = listeners.filter(l => l !== listener); },
  };
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return {
    change: (matches: boolean) => {
      media.matches = matches;
      listeners.forEach(listener => listener());
    },
  };
};

describe('useMediaQuery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restituisce false se il browser non supporta matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(renderHook(() => useMediaQuery('(max-width: 768px)')).result.current).toBe(false);
  });

  it('segue i cambiamenti della media query', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => media.change(true));

    expect(result.current).toBe(true);
  });
});

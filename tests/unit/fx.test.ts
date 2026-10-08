import { renderHook, act } from '@testing-library/react';
import { useFxConfig } from '../../src/lib/fx';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useFxConfig', () => {
  let mockMatchMedia: any;

  beforeEach(() => {
    mockMatchMedia = vi.fn();
    window.matchMedia = mockMatchMedia;
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const setupMatchMedia = (opts: { motion?: boolean; hover?: boolean; desktop?: boolean }) => {
    mockMatchMedia.mockImplementation((query: string) => {
      let matches = false;
      if (query.includes('prefers-reduced-motion')) matches = opts.motion ?? false;
      if (query.includes('hover: hover')) matches = opts.hover ?? true;
      if (query.includes('min-width: 768px')) matches = opts.desktop ?? true;
      
      return {
        matches,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });
  };

  it('should enable effects by default on desktop with hover', () => {
    setupMatchMedia({ hover: true, desktop: true, motion: false });
    
    const { result } = renderHook(() => useFxConfig());
    
    expect(result.current.fxEnabled).toBe(true);
    expect(result.current.spotlightEnabled).toBe(true);
    expect(result.current.tiltEnabled).toBe(true);
    expect(result.current.particlesEnabled).toBe(true);
  });

  it('should disable all effects if user prefers reduced motion', () => {
    setupMatchMedia({ hover: true, desktop: true, motion: true });
    
    const { result } = renderHook(() => useFxConfig());
    
    expect(result.current.fxEnabled).toBe(false);
    expect(result.current.spotlightEnabled).toBe(false);
    expect(result.current.tiltEnabled).toBe(false);
    expect(result.current.particlesEnabled).toBe(false);
  });

  it('should disable spotlight and tilt if no hover support', () => {
    setupMatchMedia({ hover: false, desktop: true, motion: false });
    
    const { result } = renderHook(() => useFxConfig());
    
    expect(result.current.fxEnabled).toBe(true);
    expect(result.current.spotlightEnabled).toBe(false);
    expect(result.current.tiltEnabled).toBe(false);
    expect(result.current.particlesEnabled).toBe(true);
  });

  it('should disable particles if not desktop width', () => {
    setupMatchMedia({ hover: true, desktop: false, motion: false });
    
    const { result } = renderHook(() => useFxConfig());
    
    expect(result.current.fxEnabled).toBe(true);
    expect(result.current.spotlightEnabled).toBe(true);
    expect(result.current.tiltEnabled).toBe(true);
    expect(result.current.particlesEnabled).toBe(false);
  });

  it('should disable all effects if localStorage fx is off', () => {
    setupMatchMedia({ hover: true, desktop: true, motion: false });
    localStorage.setItem('fx', 'off');
    
    const { result } = renderHook(() => useFxConfig());
    
    expect(result.current.fxEnabled).toBe(false);
    expect(result.current.spotlightEnabled).toBe(false);
    expect(result.current.tiltEnabled).toBe(false);
    expect(result.current.particlesEnabled).toBe(false);
  });
});


'use client';

import { useState, useEffect } from 'react';

export function getFxPreference(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('fx') !== 'off';
}

export function setFxPreference(enabled: boolean) {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.removeItem('fx');
    } else {
      localStorage.setItem('fx', 'off');
    }
    window.dispatchEvent(new Event('fx-preference-change'));
  }
}

export function useFxConfig() {
  const [state, setState] = useState({
    fxEnabled: false, // Default false to avoid hydration mismatch, or true? Actually, SSR should match initial client render. Wait, if SSR is false, then we fade it in? If we return `false` on SSR, particles/spotlight won't render on server, which is good since they are client-only.
    canHover: false,
    isDesktop: false,
    reducedMotion: false,
    mounted: false,
  });

  useEffect(() => {
    const checkMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const checkWidth = window.matchMedia('(min-width: 768px)');
    
    const update = () => {
      const stored = getFxPreference();
      setState({
        fxEnabled: stored && !checkMotion.matches,
        canHover: checkHover.matches,
        isDesktop: checkWidth.matches,
        reducedMotion: checkMotion.matches,
        mounted: true,
      });
    };

    update();
    
    const handlePrefChange = () => update();
    window.addEventListener('fx-preference-change', handlePrefChange);
    
    // Modern browsers use addEventListener for matchMedia
    if (checkMotion.addEventListener) {
      checkMotion.addEventListener('change', update);
      checkHover.addEventListener('change', update);
      checkWidth.addEventListener('change', update);
    }

    return () => {
      window.removeEventListener('fx-preference-change', handlePrefChange);
      if (checkMotion.removeEventListener) {
        checkMotion.removeEventListener('change', update);
        checkHover.removeEventListener('change', update);
        checkWidth.removeEventListener('change', update);
      }
    };
  }, []);

  return {
    ...state,
    spotlightEnabled: state.mounted && state.fxEnabled && state.canHover,
    tiltEnabled: state.mounted && state.fxEnabled && state.canHover,
    particlesEnabled: state.mounted && state.fxEnabled && state.isDesktop,
  };
}


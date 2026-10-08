'use client';

import { useEffect, useState } from 'react';
import { useFxConfig, setFxPreference } from '@/lib/fx';

export function FxToggle() {
  const { fxEnabled, mounted } = useFxConfig();
  const [localEnabled, setLocalEnabled] = useState(true);

  useEffect(() => {
    if (mounted) {
      setLocalEnabled(fxEnabled);
    }
  }, [mounted, fxEnabled]);

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="flex items-center space-x-2">
      <label className="flex items-center cursor-pointer relative">
        <input 
          type="checkbox" 
          className="sr-only peer"
          checked={!localEnabled}
          onChange={(e) => {
            const reduce = e.target.checked;
            setLocalEnabled(!reduce);
            setFxPreference(!reduce);
          }}
        />
        <div className="w-9 h-5 bg-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
        <span className="ml-3 text-sm font-medium text-text-muted">
          Reduce effects
        </span>
      </label>
    </div>
  );
}

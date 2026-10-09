'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Select } from '@/components/ui/forms';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';

const STATUSES = ['confirmed', 'waitlisted', 'cancelled', 'rejected', 'checked_in'];

export function ParticipantsFilters({ fests, statusCounts }: { fests: any[], statusCounts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [debouncedQ] = useDebounce(q, 300);

  useEffect(() => {
    if (debouncedQ !== (searchParams.get('q') || '')) {
      updateFilters({ q: debouncedQ });
    }
  }, [debouncedQ]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    params.delete('page'); // Reset page on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const currentStatuses = searchParams.getAll('status');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm mb-1 text-text-muted">Search</label>
          <Input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="Ticket code, name, email..." 
          />
        </div>
        
        <div className="w-64">
          <label className="block text-sm mb-1 text-text-muted">Event</label>
          <Select 
            value={searchParams.get('event') || ''} 
            onChange={e => updateFilters({ event: e.target.value })}
          >
            <option value="">All Events</option>
            {fests.map(fest => (
              <optgroup key={fest.id} label={fest.title}>
                {fest.events.map((evt: any) => (
                  <option key={evt.id} value={evt.id}>{evt.title}</option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => {
          const isActive = currentStatuses.includes(s);
          const count = statusCounts[s] || 0;
          return (
            <button
              key={s}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (isActive) {
                  const vals = params.getAll('status').filter(v => v !== s);
                  params.delete('status');
                  vals.forEach(v => params.append('status', v));
                } else {
                  params.append('status', s);
                }
                params.delete('page');
                startTransition(() => {
                  router.push(`${pathname}?${params.toString()}`);
                });
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                isActive 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-surface border-border text-text-muted hover:bg-surface-alt'
              }`}
            >
              <span className="capitalize">{s}</span>
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-black/20' : 'bg-surface-alt'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      
      {isPending && <div className="text-sm text-text-muted animate-pulse">Updating results...</div>}
    </div>
  );
}


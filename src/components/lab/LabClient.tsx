'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, Info, Play } from 'lucide-react';

type Outcome = 'c' | 'w' | 'e';

type LabResult = {
  requested: number;
  confirmed: number;
  waitlisted: number;
  errors: number;
  oversold: boolean;
  invariantsOk: boolean;
  outcomes: Outcome[];
};

export function LabClient({ lang }: { lang: 'en' | 'bn' }) {
  const [count, setCount] = useState<number>(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LabResult | null>(null);
  const [displayedOutcomes, setDisplayedOutcomes] = useState<Outcome[]>([]);

  const runLab = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setDisplayedOutcomes([]);

    try {
      const res = await fetch('/api/lab/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run lab');
      }

      setResult(data);
      
      // Staggered animation
      let currentOutcomes: Outcome[] = [];
      for (let i = 0; i < data.outcomes.length; i++) {
        setTimeout(() => {
          currentOutcomes = [...currentOutcomes, data.outcomes[i]];
          setDisplayedOutcomes(currentOutcomes);
        }, i * 20); // 20ms delay per square
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSquareColor = (outcome: Outcome) => {
    switch (outcome) {
      case 'c': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'w': return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'e': return 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
      default: return 'bg-surface-alt';
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex bg-surface-alt p-1 rounded-xl">
          {[50, 100, 200].map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              disabled={loading}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                count === c ? 'bg-bg text-text shadow-sm' : 'text-text-muted hover:text-text'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        
        <Button onClick={runLab} disabled={loading} size="lg" className="gap-2 w-full md:w-auto">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
          {lang === 'bn' ? `${count} রেজিস্ট্রেশন ফায়ার করুন` : `Fire ${count} registrations`}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Grid */}
      <div className="bg-surface border border-border p-8 rounded-2xl">
        <div className="flex flex-wrap justify-center gap-1 md:gap-2 min-h-[200px] content-start">
          {Array.from({ length: count }).map((_, i) => {
            const outcome = displayedOutcomes[i];
            return (
              <div
                key={i}
                className={`w-4 h-4 md:w-6 md:h-6 rounded-sm md:rounded transition-all duration-300 ${
                  outcome ? getSquareColor(outcome) : 'bg-surface-alt'
                }`}
                style={{ 
                  transform: outcome ? 'scale(1)' : 'scale(0.8)',
                  opacity: outcome ? 1 : 0.3 
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Results Summary */}
      {result && displayedOutcomes.length === result.outcomes.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-surface border border-border p-6 rounded-xl space-y-4">
            <h3 className="font-bold text-lg font-heading">{lang === 'bn' ? 'ফলাফল' : 'Results'}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Requested</span>
                <span className="font-bold">{result.requested}</span>
              </div>
              <div className="flex justify-between text-emerald-500">
                <span>Confirmed</span>
                <span className="font-bold">{result.confirmed} / 50</span>
              </div>
              <div className="flex justify-between text-amber-500">
                <span>Waitlisted</span>
                <span className="font-bold">{result.waitlisted}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Errors</span>
                <span className="font-bold">{result.errors}</span>
              </div>
            </div>
          </div>
          
          <div className={`border p-6 rounded-xl flex flex-col justify-center ${result.invariantsOk ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
            <div className="flex items-center gap-3 mb-2">
              {result.invariantsOk ? <CheckCircle2 className="w-8 h-8 shrink-0" /> : <AlertTriangle className="w-8 h-8 shrink-0" />}
              <h3 className="font-bold text-xl font-heading">
                {result.invariantsOk ? 'Invariants OK' : 'Invariants Failed'}
              </h3>
            </div>
            <p className="opacity-90 text-sm">
              {result.invariantsOk 
                ? 'System successfully prevented overselling despite massive concurrent load.' 
                : 'System failed to maintain correctness under concurrent load.'}
            </p>
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span>Waitlisted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-rose-500" />
          <span>Error</span>
        </div>
      </div>
    </div>
  );
}


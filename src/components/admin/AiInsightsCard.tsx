'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle } from 'lucide-react';

export function AiInsightsCard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ insights: string[], recommendation: string } | null>(null);
  const [error, setError] = useState('');

  const generateInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.code);
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load insights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 col-span-1 md:col-span-2 lg:col-span-3 border-emerald-500/30 bg-emerald-500/5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold font-heading">AI Organizer Insights</h2>
        </div>
        {!data && !loading && (
          <Button variant="secondary" size="sm" onClick={generateInsights}>
            Generate Insights
          </Button>
        )}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-emerald-500/20 rounded w-3/4"></div>
          <div className="h-4 bg-emerald-500/20 rounded w-full"></div>
          <div className="h-4 bg-emerald-500/20 rounded w-5/6"></div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-danger bg-danger/10 p-3 rounded-md text-sm">
          <AlertCircle className="w-4 h-4" />
          <p>{error}</p>
          <Button variant="ghost" size="sm" onClick={generateInsights} className="ml-auto">Retry</Button>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <ul className="space-y-2 list-disc list-inside text-sm text-foreground/80">
            {data.insights?.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
          <div className="p-3 bg-emerald-500/10 rounded-md border border-emerald-500/20">
            <strong className="text-emerald-700 dark:text-emerald-400 text-sm block mb-1">Recommendation:</strong>
            <p className="text-sm">{data.recommendation}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={generateInsights} className="w-full text-xs text-muted-foreground mt-2">
            Refresh Insights
          </Button>
        </div>
      )}
      
      {!data && !loading && !error && (
        <p className="text-sm text-muted-foreground">Click to analyze your current registration data and identify events needing attention.</p>
      )}
    </Card>
  );
}


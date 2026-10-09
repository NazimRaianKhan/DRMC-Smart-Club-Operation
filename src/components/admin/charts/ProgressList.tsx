import React from 'react';

export function ProgressList({ data }: { data: { label: string, count: number, total?: number }[] }) {
  const max = Math.max(...data.map(d => d.total || d.count), 1);
  
  return (
    <div className="space-y-4">
      <table className="sr-only">
        <caption>Data table for progress list</caption>
        <thead>
          <tr><th>Item</th><th>Value</th></tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{d.count}{d.total ? ` / ${d.total}` : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.map((d, i) => {
        const pct = ((d.count / (d.total || max)) * 100).toFixed(1);
        return (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate pr-4">{d.label}</span>
              <span className="text-text-muted shrink-0">{d.count}{d.total ? ` / ${d.total}` : ''}</span>
            </div>
            {/* Using SVG for the progress bar as requested */}
            <svg viewBox="0 0 100 2" className="w-full h-2 rounded-full overflow-hidden" preserveAspectRatio="none" role="img" aria-label={`Progress bar: ${pct}%`}>
              <rect x="0" y="0" width="100" height="2" fill="var(--surface-alt)" />
              <rect x="0" y="0" width={pct} height="2" fill="var(--primary)" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}


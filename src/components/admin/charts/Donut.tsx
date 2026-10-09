import React from 'react';

export function Donut({ data }: { data: { category: string, count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  let cumulative = 0;
  
  // Colors for segments
  const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="flex gap-6 items-center">
      <table className="sr-only">
        <caption>Registrations by category</caption>
        <thead>
          <tr><th>Category</th><th>Count</th></tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.category}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="w-32 h-32 shrink-0">
        <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90" role="img" aria-label="Donut chart showing registrations by category">
          <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="var(--surface-alt)" strokeWidth="8"></circle>
          {data.map((d, i) => {
            if (d.count === 0) return null;
            const pct = (d.count / total) * 100;
            const dash = `${pct} ${100 - pct}`;
            const offset = 100 - cumulative;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx="21"
                cy="21"
                r="15.91549430918954"
                fill="transparent"
                stroke={colors[i % colors.length]}
                strokeWidth="8"
                strokeDasharray={dash}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              >
                <title>{d.category}: {d.count}</title>
              </circle>
            );
          })}
        </svg>
      </div>
      
      <div className="flex flex-col gap-2 text-sm flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
              <span className="capitalize">{d.category}</span>
            </div>
            <span className="font-medium">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

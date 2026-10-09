import React from 'react';

export function BarChart({ data }: { data: { date: Date, count: number }[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const width = 300;
  const height = 100;
  const barWidth = width / data.length;

  return (
    <div className="w-full aspect-[3/1] relative">
      <table className="sr-only">
        <caption>Registrations over the last 14 days</caption>
        <thead>
          <tr><th>Date</th><th>Registrations</th></tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{new Date(d.date).toLocaleDateString()}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" role="img" aria-label="Bar chart showing registrations over the last 14 days">
        {data.map((d, i) => {
          const h = (d.count / max) * height;
          return (
            <g key={i}>
              <rect
                x={i * barWidth + (barWidth * 0.1)}
                y={height - h}
                width={barWidth * 0.8}
                height={h}
                fill="var(--primary)"
                className="transition-all duration-500 ease-out"
              />
              <title>{new Date(d.date).toLocaleDateString()}: {d.count}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

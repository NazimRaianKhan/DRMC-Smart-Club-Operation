import { db } from '@/db/client';
import { houses, housePoints } from '@/db/schema';
import { sql } from 'drizzle-orm';
import type { Metadata } from 'next';
import { Trophy } from 'lucide-react';
import { HouseBar } from './HouseBar';

export const instant = false;

export const metadata: Metadata = {
  title: 'House Cup Leaderboard',
  description: 'Inter-house points leaderboard',
};

type Props = { params: Promise<{ lang: 'en' | 'bn' }> };

export default async function HouseCupPage({ params }: Props) {
  const { lang } = await params;
  
  // Aggregate points per house
  const result = await db.execute(sql`
    SELECT h.id, h.name, h.color, COALESCE(SUM(hp.points), 0) as total_points
    FROM houses h
    LEFT JOIN house_points hp ON h.id = hp.house_id
    GROUP BY h.id, h.name, h.color
    ORDER BY total_points DESC
  `);

  const leaderboard = result.rows as { id: string, name: string, color: string, total_points: number }[];
  const maxPoints = Math.max(...leaderboard.map(r => r.total_points), 100);

  return (
    <main className="flex-1 pb-32">
      <div className="container max-w-4xl px-4 md:px-6 py-12">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-4 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <Trophy className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-2">
            {lang === 'bn' ? 'হাউস কাপ লিডারবোর্ড' : 'House Cup Leaderboard'}
          </h1>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            {lang === 'bn' ? 'আমাদের বিভিন্ন হাউসের মধ্যে প্রতিযোগিতার সর্বশেষ পয়েন্ট তালিকা।' : 'Current standings in the inter-house competition.'}
          </p>
        </div>
        
        <div className="bg-surface/50 border border-border p-6 md:p-10 rounded-3xl space-y-8">
          {leaderboard.map((house, index) => (
            <div key={house.id} className="relative">
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-text-muted w-6">{index + 1}.</span>
                  <h3 className="text-lg md:text-xl font-bold">{house.name}</h3>
                </div>
                <div className="text-xl md:text-2xl font-black tracking-tighter" style={{ color: house.color }}>
                  {house.total_points}
                  <span className="text-sm font-medium text-text-muted ml-1 uppercase tracking-widest opacity-70">pts</span>
                </div>
              </div>
              <div className="h-6 w-full bg-surface-alt rounded-full overflow-hidden flex">
                <HouseBar color={house.color} percentage={Math.max(0, (house.total_points / maxPoints) * 100)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}


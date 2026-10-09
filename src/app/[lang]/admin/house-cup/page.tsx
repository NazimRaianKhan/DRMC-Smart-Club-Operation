import { requireRole } from '@/server/auth';
import { db } from '@/db/client';
import { houses, housePoints } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getDictionary } from '@/i18n';
import { AwardPointsForm } from './AwardPointsForm';

export const instant = false;

type Props = { params: Promise<{ lang: 'en' | 'bn' }> };

export default async function AdminHouseCupPage({ params }: Props) {
  const { lang } = await params;
  await requireRole(['admin']);
  
  const dict = await getDictionary(lang);
  const allHouses = await db.query.houses.findMany({
    orderBy: (houses, { asc }) => [asc(houses.name)]
  });

  const recentPoints = await db.query.housePoints.findMany({
    with: { house: true },
    orderBy: (points, { desc }) => [desc(points.createdAt)],
    limit: 20
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">{lang === 'bn' ? 'হাউস কাপ অ্যাডমিন' : 'House Cup Admin'}</h1>
        <p className="text-text-muted mt-1">{lang === 'bn' ? 'হাউসগুলোকে পয়েন্ট দিন' : 'Award points to houses'}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface border border-border p-6 rounded-2xl">
          <h2 className="text-xl font-bold font-heading mb-6">{lang === 'bn' ? 'পয়েন্ট দিন' : 'Award Points'}</h2>
          <AwardPointsForm houses={allHouses} lang={lang} />
        </div>

        <div className="bg-surface border border-border p-6 rounded-2xl">
          <h2 className="text-xl font-bold font-heading mb-6">{lang === 'bn' ? 'সাম্প্রতিক পয়েন্ট' : 'Recent Points'}</h2>
          <div className="space-y-4">
            {recentPoints.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-surface-alt border border-border">
                <div>
                  <p className="font-bold">{p.house.name}</p>
                  <p className="text-sm text-text-muted">{p.reason}</p>
                </div>
                <div className={`font-bold text-lg ${p.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {p.points > 0 ? '+' : ''}{p.points}
                </div>
              </div>
            ))}
            {recentPoints.length === 0 && (
              <p className="text-text-muted text-sm">{lang === 'bn' ? 'কোনো পয়েন্ট দেওয়া হয়নি' : 'No points awarded yet'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { awardPointsAction } from './actions';

export function AwardPointsForm({ houses, lang }: { houses: any[], lang: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function action(formData: FormData) {
    setLoading(true);
    await awardPointsAction(formData);
    setLoading(false);
    router.refresh();
  }

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-sm font-medium">{lang === 'bn' ? 'হাউস' : 'House'}</span>
        <select name="houseId" required className="w-full h-10 rounded-md border border-border bg-bg px-3">
          <option value="">{lang === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
          {houses.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">{lang === 'bn' ? 'পয়েন্ট (ইতিবাচক বা নেতিবাচক)' : 'Points (Positive or Negative)'}</span>
        <input name="points" type="number" required placeholder="e.g. 50" className="w-full h-10 rounded-md border border-border bg-bg px-3" />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">{lang === 'bn' ? 'কারণ' : 'Reason'}</span>
        <input name="reason" type="text" required placeholder="e.g. Won the programming contest" className="w-full h-10 rounded-md border border-border bg-bg px-3" />
      </label>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving...') : (lang === 'bn' ? 'পয়েন্ট দিন' : 'Award Points')}
      </Button>
    </form>
  );
}


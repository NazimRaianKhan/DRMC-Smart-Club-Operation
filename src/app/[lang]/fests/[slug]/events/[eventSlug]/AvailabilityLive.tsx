'use client';

import { useEffect, useState } from 'react';
import { formatRelativeCloses } from '@/lib/format';

interface AvailabilityData {
  capacity: number;
  confirmedCount: number;
  seatsLeft: number;
  waitlistCount: number;
  state: string;
  serverTime: number;
}

export function AvailabilityLive({
  eventId,
  initialData,
  lang,
  isTeam,
  dict,
}: {
  eventId: string;
  initialData: AvailabilityData;
  lang: string;
  isTeam: boolean;
  dict: any;
}) {
  const [data, setData] = useState<AvailabilityData>(initialData);
  const [now, setNow] = useState(Date.now());

  // Fetch logic
  useEffect(() => {
    // If closed or ended, no need to poll
    if (['closed', 'ended', 'full', 'cancelled', 'not_open'].includes(data.state)) {
      if (data.state === 'full' && !initialData.waitlistCount /* waitlist info not enabled or full waitlist */) {
        // Stop polling if fully full
        return;
      }
      if (['closed', 'ended', 'cancelled'].includes(data.state)) return;
    }

    let timer: number;
    const fetchAvail = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/api/events/${eventId}/availability`);
        if (res.ok) {
          const fresh = await res.json();
          setData(fresh);
        }
      } catch (e) {
        // keep last value
      }
    };

    const interval = setInterval(fetchAvail, 20000);
    const handleVis = () => {
      if (document.visibilityState === 'visible') fetchAvail();
    };
    document.addEventListener('visibilitychange', handleVis);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [eventId, data.state, initialData.waitlistCount]);

  // Local timer for countdown (every 30s)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const percent = Math.min(100, Math.max(0, (data.confirmedCount / data.capacity) * 100));
  
  // Wording
  const unit = isTeam ? (lang === 'bn' ? 'টি দল' : 'teams') : (lang === 'bn' ? 'টি আসন' : 'seats');
  
  return (
    <div className="space-y-3 min-h-[80px]">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>
          {data.seatsLeft > 0 ? (
            lang === 'bn' ? `আর ${data.seatsLeft}${unit} বাকি` : `${data.seatsLeft} ${unit} left`
          ) : (
            lang === 'bn' ? 'আসন পূর্ণ' : 'Capacity reached'
          )}
        </span>
        <span className="text-text-muted">{Math.round(percent)}%</span>
      </div>
      
      <div className="w-full bg-border h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${percent >= 100 ? 'bg-danger' : percent > 80 ? 'bg-warning' : 'bg-success'} transition-all duration-1000`} 
          style={{ width: `${percent}%` }}
        />
      </div>

      {data.waitlistCount > 0 && (
        <p className="text-xs text-text-muted">
          {lang === 'bn' ? `অপেক্ষমান তালিকায় ${data.waitlistCount} জন` : `${data.waitlistCount} in waitlist`}
        </p>
      )}
    </div>
  );
}


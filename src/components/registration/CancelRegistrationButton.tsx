'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

export function CancelRegistrationButton({ registrationId, lang }: { registrationId: string, lang: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCancel = async () => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/cancel`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to cancel registration');
      }
    } finally {
      setIsPending(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <Button variant="destructive" onClick={() => setShowConfirm(true)} className="w-full sm:w-auto">
        <Trash2 className="w-4 h-4 mr-2" />
        {lang === 'bn' ? 'রেজিস্ট্রেশন বাতিল করুন' : 'Cancel Registration'}
      </Button>
    );
  }

  return (
    <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl space-y-4">
      <p className="font-medium text-danger">
        {lang === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি রেজিস্ট্রেশন বাতিল করতে চান?' : 'Are you sure you want to cancel this registration?'}
      </p>
      <div className="flex gap-3">
        <Button variant="destructive" onClick={handleCancel} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {lang === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Cancel'}
        </Button>
        <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>
          {lang === 'bn' ? 'না, থাক' : 'No, Keep it'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/forms';
import { resetDemoDatabase } from '@/server/actions/demo';

export function DemoResetButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);

  const handleReset = async () => {
    if (text !== 'RESET') return;
    setPending(true);
    try {
      await resetDemoDatabase(text);
      alert('Demo database reset successfully.');
      setOpen(false);
      setText('');
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPending(false);
    }
  };

  if (!open) {
    return (
      <Button variant="danger" onClick={() => setOpen(true)}>Reset demo data</Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-danger/10 border border-danger/20 rounded-lg">
      <p className="text-sm font-medium text-danger">Type RESET to confirm database wipe.</p>
      <div className="flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="RESET" className="w-32 bg-surface" />
        <Button variant="danger" disabled={text !== 'RESET' || pending} onClick={handleReset}>
          {pending ? 'Resetting...' : 'Confirm'}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordInput = z.infer<typeof passwordSchema>;

export function SecurityForm({ lang }: { lang: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema)
  });
  
  const newPassword = watch('newPassword', '');
  const strength = Math.min(100, (newPassword.length / 8) * 50 + (/[A-Z]/.test(newPassword) ? 25 : 0) + (/[0-9]/.test(newPassword) ? 25 : 0));

  const onSubmit = async (data: PasswordInput) => {
    setIsPending(true);
    setSuccess(false);
    setErrorMsg('');
    try {
      const res = await fetch('/api/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setSuccess(true);
        reset();
      } else {
        setErrorMsg(result.message || 'Failed to update password');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg">
          {lang === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে' : 'Password changed successfully'}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-lg">
          {errorMsg}
        </div>
      )}
      
      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}</Label>
        <Input type="password" {...register('currentPassword')} />
        {errors.currentPassword && <p className="text-danger text-sm">{errors.currentPassword.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}</Label>
        <Input type="password" {...register('newPassword')} />
        {errors.newPassword && <p className="text-danger text-sm">{errors.newPassword.message}</p>}
        {newPassword.length > 0 && (
          <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full ${strength < 50 ? 'bg-danger' : strength < 100 ? 'bg-amber-500' : 'bg-emerald-500'} transition-all`} 
              style={{ width: `${strength}%` }}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}</Label>
        <Input type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-danger text-sm">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}
      </Button>
    </form>
  );
}


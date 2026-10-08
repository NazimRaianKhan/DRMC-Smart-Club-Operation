'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { classLevels } from '@/lib/validation/registration';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^(?:\+?88)?01[3-9]\d{8}$/).or(z.literal('')).optional(),
  institution: z.string().trim().min(2).max(80),
  classLevel: z.enum(classLevels),
  studentId: z.string().trim().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

export function ProfileForm({ user, lang }: { user: any, lang: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || '',
      phone: user.phone || '',
      institution: user.institution || '',
      classLevel: user.classLevel || '10',
      studentId: user.studentId || '',
    }
  });

  const onSubmit = async (data: ProfileInput) => {
    setIsPending(true);
    setSuccess(false);
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        alert('Failed to update profile');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg">
          {lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে' : 'Profile updated successfully'}
        </div>
      )}
      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'পুরো নাম' : 'Full Name'}</Label>
        <Input {...register('fullName')} />
        {errors.fullName && <p className="text-danger text-sm">{errors.fullName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}</Label>
        <Input {...register('phone')} placeholder="01XXXXXXXXX" />
        {errors.phone && <p className="text-danger text-sm">{errors.phone.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Institution'}</Label>
        <Input {...register('institution')} />
        {errors.institution && <p className="text-danger text-sm">{errors.institution.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'শ্রেণি' : 'Class Level'}</Label>
        <Select onValueChange={(v) => setValue('classLevel', v as any)} defaultValue={user.classLevel || '10'}>
          <SelectTrigger>
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            {classLevels.map(c => (
              <SelectItem key={c} value={c}>{c === 'other' ? 'Other' : `Class ${c}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.classLevel && <p className="text-danger text-sm">{errors.classLevel.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{lang === 'bn' ? 'স্টুডেন্ট আইডি' : 'Student ID'}</Label>
        <Input {...register('studentId')} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Profile'}
      </Button>
    </form>
  );
}

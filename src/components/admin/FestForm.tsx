'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { festSchema, FestInput } from '@/lib/validation/admin';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/forms';
import { useRouter } from 'next/navigation';
import { createFest, updateFest } from '@/server/admin';

export function FestForm({ initialData, festId }: { initialData?: FestInput, festId?: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FestInput>({
    resolver: zodResolver(festSchema),
    defaultValues: initialData || {
      organizationId: '',
      title: '',
      slug: '',
      tagline: '',
      description: '',
      startsAt: '',
      endsAt: '',
      venue: '',
      accent: 'cyan',
      status: 'draft',
      titleBn: '',
      taglineBn: '',
      descriptionBn: ''
    }
  });

  const onSubmit = async (data: FestInput) => {
    setPending(true);
    setError('');
    try {
      if (festId) {
        await updateFest(festId, data);
      } else {
        await createFest(data);
      }
      router.push('/en/admin/fests');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-surface p-6 rounded-xl border border-border">
      {error && <div className="p-4 bg-danger/10 text-danger rounded-lg">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Organization ID *</Label>
          <Input {...register('organizationId')} />
          {errors.organizationId && <p className="text-danger text-sm">{errors.organizationId.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input {...register('title')} />
          {errors.title && <p className="text-danger text-sm">{errors.title.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Slug *</Label>
          <Input {...register('slug')} />
          {errors.slug && <p className="text-danger text-sm">{errors.slug.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Tagline *</Label>
          <Input {...register('tagline')} />
          {errors.tagline && <p className="text-danger text-sm">{errors.tagline.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Description *</Label>
          <Textarea {...register('description')} rows={4} />
          {errors.description && <p className="text-danger text-sm">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Starts At (Dhaka Local) *</Label>
          <Input type="datetime-local" {...register('startsAt')} />
          {errors.startsAt && <p className="text-danger text-sm">{errors.startsAt.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Ends At (Dhaka Local) *</Label>
          <Input type="datetime-local" {...register('endsAt')} />
          {errors.endsAt && <p className="text-danger text-sm">{errors.endsAt.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Venue *</Label>
          <Input {...register('venue')} />
          {errors.venue && <p className="text-danger text-sm">{errors.venue.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select {...register('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Accent</Label>
          <Select {...register('accent')}>
            <option value="cyan">Cyan</option>
            <option value="gold">Gold</option>
            <option value="violet">Violet</option>
            <option value="emerald">Emerald</option>
          </Select>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border">
        <Button type="submit" disabled={pending} className="w-full md:w-auto">
          {pending ? 'Saving...' : festId ? 'Update Fest' : 'Create Fest'}
        </Button>
      </div>
    </form>
  );
}

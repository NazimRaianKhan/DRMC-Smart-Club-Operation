'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventInput } from '@/lib/validation/admin';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/forms';
import { useRouter } from 'next/navigation';
import { createEvent, updateEvent, cancelEvent } from '@/server/admin';

export function EventForm({ initialData, eventId, fests }: { initialData?: any, eventId?: string, fests: any[] }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData || {
      festId: fests[0]?.id || '',
      title: '',
      slug: '',
      shortDescription: '',
      description: '',
      category: 'programming',
      startsAt: '',
      endsAt: '',
      venue: '',
      capacity: 100,
      participationType: 'individual',
      teamMinSize: 1,
      teamMaxSize: 1,
      registrationOpensAt: '',
      registrationDeadline: '',
      waitlistEnabled: true,
      status: 'draft',
      faqs: [],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'faqs' });
  const participationType = watch('participationType');
  const status = watch('status');

  const onSubmit = async (data: EventInput) => {
    setPending(true);
    setError('');
    try {
      if (eventId) {
        await updateEvent(eventId, data);
      } else {
        await createEvent(data);
      }
      router.push('/en/admin/events');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setPending(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!eventId) return;
    if (confirm('Are you sure you want to cancel this event? Registrations will be kept but the event will be cancelled.')) {
      try {
        await cancelEvent(eventId);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-surface p-6 rounded-xl border border-border">
      {error && <div className="p-4 bg-danger/10 text-danger rounded-lg">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label>Fest *</Label>
          <Select {...register('festId')}>
            {fests.map(fest => <option key={fest.id} value={fest.id}>{fest.title}</option>)}
          </Select>
          {errors.festId && <p className="text-danger text-sm">{errors.festId.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input {...register('title')} />
          {errors.title && <p className="text-danger text-sm">{errors.title.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Slug (Editable in draft) *</Label>
          <Input {...register('slug')} readOnly={eventId !== undefined && initialData?.status !== 'draft'} className="read-only:opacity-50" />
          {errors.slug && <p className="text-danger text-sm">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select {...register('category')}>
            <option value="programming">Programming</option>
            <option value="ai_ml">AI/ML</option>
            <option value="web_dev">Web Dev</option>
            <option value="robotics">Robotics</option>
            <option value="gaming">Gaming</option>
            <option value="workshop">Workshop</option>
            <option value="quiz">Quiz</option>
            <option value="hackathon">Hackathon</option>
            <option value="other">Other</option>
          </Select>
          {errors.category && <p className="text-danger text-sm">{errors.category.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Short Description *</Label>
          <Input {...register('shortDescription')} />
          {errors.shortDescription && <p className="text-danger text-sm">{errors.shortDescription.message}</p>}
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
          <Label>Registration Opens At (Optional)</Label>
          <Input type="datetime-local" {...register('registrationOpensAt')} />
        </div>
        
        <div className="space-y-2">
          <Label>Registration Deadline *</Label>
          <Input type="datetime-local" {...register('registrationDeadline')} />
          {errors.registrationDeadline && <p className="text-danger text-sm">{errors.registrationDeadline.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Venue *</Label>
          <Input {...register('venue')} />
          {errors.venue && <p className="text-danger text-sm">{errors.venue.message}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Capacity *</Label>
          <Input type="number" {...register('capacity', { valueAsNumber: true })} />
          {errors.capacity && <p className="text-danger text-sm">{errors.capacity.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Participation Type</Label>
          <Select {...register('participationType')}>
            <option value="individual">Individual</option>
            <option value="team">Team</option>
          </Select>
        </div>
        
        <div className="flex gap-4">
          <div className="space-y-2 flex-1">
            <Label>Min Team Size</Label>
            <Input type="number" {...register('teamMinSize', { valueAsNumber: true })} disabled={participationType !== 'team'} />
            {errors.teamMinSize && <p className="text-danger text-sm">{errors.teamMinSize.message}</p>}
          </div>
          <div className="space-y-2 flex-1">
            <Label>Max Team Size</Label>
            <Input type="number" {...register('teamMaxSize', { valueAsNumber: true })} disabled={participationType !== 'team'} />
            {errors.teamMaxSize && <p className="text-danger text-sm">{errors.teamMaxSize.message}</p>}
          </div>
        </div>

        <div className="space-y-2 flex items-center gap-2">
          <input type="checkbox" id="waitlist" {...register('waitlistEnabled')} className="mt-6" />
          <Label htmlFor="waitlist" className="mt-6">Enable Waitlist</Label>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select {...register('status')}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex justify-between items-center">
          <Label className="text-lg">FAQs</Label>
          {fields.length < 8 && (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ q: '', a: '' })}>Add FAQ</Button>
          )}
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 bg-surface-alt rounded-lg flex gap-4">
            <div className="flex-1 space-y-2">
              <Input placeholder="Question" {...register(`faqs.${index}.q` as const)} />
              {errors?.faqs?.[index]?.q && <p className="text-danger text-sm">{errors.faqs[index]?.q?.message}</p>}
              <Textarea placeholder="Answer" rows={2} {...register(`faqs.${index}.a` as const)} />
              {errors?.faqs?.[index]?.a && <p className="text-danger text-sm">{errors.faqs[index]?.a?.message}</p>}
            </div>
            <Button type="button" variant="ghost" onClick={() => remove(index)}>Remove</Button>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-border flex justify-between items-center">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
        </Button>
        {eventId && initialData?.status !== 'cancelled' && (
          <Button type="button" variant="destructive" onClick={handleCancelEvent}>
            Cancel Event
          </Button>
        )}
      </div>
    </form>
  );
}

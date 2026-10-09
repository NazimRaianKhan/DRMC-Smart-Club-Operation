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
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as any,
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
      faqsBn: [],
    }
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'faqs' });
  const { fields: bnFields, append: bnAppend, remove: bnRemove, replace: bnReplace } = useFieldArray({ control, name: 'faqsBn' });
  const participationType = watch('participationType');
  const status = watch('status');

  const [draftState, setDraftState] = useState<'idle' | 'loading' | 'preview'>('idle');
  const [draftPreview, setDraftPreview] = useState<any>(null);
  const [draftError, setDraftError] = useState('');

  const [translateState, setTranslateState] = useState<'idle' | 'loading' | 'preview'>('idle');
  const [translatePreview, setTranslatePreview] = useState<any>(null);
  const [translateError, setTranslateError] = useState('');

  const handleDraft = async () => {
    const { title, category, participationType } = watch();
    if (!title || !category) {
      setDraftError("Title and Category are required to draft");
      return;
    }
    setDraftState('loading');
    setDraftError('');
    try {
      const res = await fetch('/api/ai/draft-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, participationType })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.code);
      setDraftPreview(json.data);
      setDraftState('preview');
    } catch (err: any) {
      setDraftError(err.message || 'Error generating draft');
      setDraftState('idle');
    }
  };

  const applyDraft = () => {
    if (!draftPreview) return;
    setValue('shortDescription', draftPreview.shortDescription);
    setValue('description', draftPreview.description);
    if (draftPreview.faq && Array.isArray(draftPreview.faq)) {
      replace(draftPreview.faq);
    }
    setDraftState('idle');
    setDraftPreview(null);
  };

  const handleTranslate = async () => {
    const { title, shortDescription, description, faqs } = watch();
    if (!title || !description) {
      setTranslateError("Title and Description are required to translate");
      return;
    }
    setTranslateState('loading');
    setTranslateError('');
    try {
      const res = await fetch('/api/ai/translate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, shortDescription, description, faq: faqs })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.code);
      setTranslatePreview(json.data);
      setTranslateState('preview');
    } catch (err: any) {
      setTranslateError(err.message || 'Error generating translation');
      setTranslateState('idle');
    }
  };

  const applyTranslate = () => {
    if (!translatePreview) return;
    setValue('titleBn', translatePreview.titleBn);
    setValue('shortDescriptionBn', translatePreview.shortDescriptionBn);
    setValue('descriptionBn', translatePreview.descriptionBn);
    if (translatePreview.faqBn && Array.isArray(translatePreview.faqBn)) {
      bnReplace(translatePreview.faqBn);
    }
    setTranslateState('idle');
    setTranslatePreview(null);
  };

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
    if (confirm('Are you sure you want to cancel this event?')) {
      try {
        await cancelEvent(eventId);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft Preview Modal/Overlay */}
      {draftState === 'preview' && draftPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 font-heading">AI Draft Preview</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Short Description</Label>
                <p className="p-3 bg-surface-alt rounded-md">{draftPreview.shortDescription}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Description</Label>
                <div className="p-3 bg-surface-alt rounded-md whitespace-pre-wrap">{draftPreview.description}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">FAQs</Label>
                <ul className="space-y-2 mt-2">
                  {draftPreview.faq?.map((f: any, i: number) => (
                    <li key={i} className="p-3 bg-surface-alt rounded-md">
                      <strong>Q:</strong> {f.q}<br/>
                      <strong>A:</strong> {f.a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setDraftState('idle')}>Discard</Button>
              <Button variant="ghost" onClick={handleDraft}>Regenerate</Button>
              <Button onClick={applyDraft}>Use this</Button>
            </div>
          </div>
        </div>
      )}

      {/* Translate Preview Modal/Overlay */}
      {translateState === 'preview' && translatePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 font-heading">AI Translation Preview</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-sm">Title (Bangla)</Label>
                <p className="p-3 bg-surface-alt rounded-md font-bn">{translatePreview.titleBn}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Short Description (Bangla)</Label>
                <p className="p-3 bg-surface-alt rounded-md font-bn">{translatePreview.shortDescriptionBn}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Description (Bangla)</Label>
                <div className="p-3 bg-surface-alt rounded-md whitespace-pre-wrap font-bn">{translatePreview.descriptionBn}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">FAQs (Bangla)</Label>
                <ul className="space-y-2 mt-2">
                  {translatePreview.faqBn?.map((f: any, i: number) => (
                    <li key={i} className="p-3 bg-surface-alt rounded-md font-bn">
                      <strong>Q:</strong> {f.q}<br/>
                      <strong>A:</strong> {f.a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setTranslateState('idle')}>Discard</Button>
              <Button variant="ghost" onClick={handleTranslate}>Regenerate</Button>
              <Button onClick={applyTranslate}>Use this</Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8 bg-surface p-6 rounded-xl border border-border">
        {error && <div className="p-4 bg-danger/10 text-danger rounded-lg">{error}</div>}
        
        {/* ENGLISH SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">English (Primary)</h3>
            <div className="flex items-center gap-4">
              {draftError && <span className="text-sm text-danger">{draftError}</span>}
              <Button type="button" variant="secondary" onClick={handleDraft} disabled={draftState === 'loading'}>
                {draftState === 'loading' ? 'Drafting...' : '✨ Draft with AI'}
              </Button>
            </div>
          </div>

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
              <Textarea {...register('description')} rows={6} />
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
              <Label className="text-lg">FAQs (English)</Label>
              {fields.length < 8 && (
                <Button type="button" variant="secondary" size="sm" onClick={() => append({ q: '', a: '' })}>Add FAQ</Button>
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
        </div>

        {/* BANGLA SECTION */}
        <div className="space-y-6 pt-8 border-t-4 border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-bn">বাংলা (Bengali)</h3>
            <div className="flex items-center gap-4">
              {translateError && <span className="text-sm text-danger">{translateError}</span>}
              <Button type="button" variant="secondary" onClick={handleTranslate} disabled={translateState === 'loading'}>
                {translateState === 'loading' ? 'Translating...' : '✨ Translate to Bangla'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Title (Bangla)</Label>
              <Input {...register('titleBn')} className="font-bn" />
            </div>
            <div className="space-y-2">
              <Label>Short Description (Bangla)</Label>
              <Input {...register('shortDescriptionBn')} className="font-bn" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description (Bangla)</Label>
              <Textarea {...register('descriptionBn')} rows={6} className="font-bn" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <Label className="text-lg">FAQs (Bangla)</Label>
              {bnFields.length < 8 && (
                <Button type="button" variant="secondary" size="sm" onClick={() => bnAppend({ q: '', a: '' })}>Add FAQ (Bangla)</Button>
              )}
            </div>
            {bnFields.map((field, index) => (
              <div key={field.id} className="p-4 bg-surface-alt rounded-lg flex gap-4">
                <div className="flex-1 space-y-2">
                  <Input placeholder="Question (Bangla)" {...register(`faqsBn.${index}.q` as const)} className="font-bn" />
                  <Textarea placeholder="Answer (Bangla)" rows={2} {...register(`faqsBn.${index}.a` as const)} className="font-bn" />
                </div>
                <Button type="button" variant="ghost" onClick={() => bnRemove(index)}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-border flex justify-between items-center">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
          </Button>
          {eventId && initialData?.status !== 'cancelled' && (
            <Button type="button" variant="danger" onClick={handleCancelEvent}>
              Cancel Event
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

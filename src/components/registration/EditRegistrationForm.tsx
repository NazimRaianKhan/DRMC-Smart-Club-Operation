'use client';

import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { classLevels, createRegistrationSchema, type MemberInput, type RegistrationInput } from '@/lib/validation/registration';
import type { RegistrationLabels } from '@/i18n/registration';

interface EditRegistrationFormProps {
  registrationId: string; lang: string; participationType: 'individual' | 'team';
  teamMinSize: number; teamMaxSize: number; labels: RegistrationLabels; 
  initialData: RegistrationInput;
}

const blankMember = (): MemberInput => ({ fullName: '', email: '', phone: '', institution: '', classLevel: '10', studentId: '' });
const inputClass = 'w-full min-w-0 rounded-lg border border-border bg-surface px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-accent';

export function EditRegistrationForm(props: EditRegistrationFormProps) {
  const { registrationId, lang, participationType, teamMinSize, teamMaxSize, labels, initialData } = props;
  const router = useRouter();
  const isTeam = participationType === 'team';
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, control, handleSubmit, setError, clearErrors, formState: { errors } } = useForm<RegistrationInput>({
    defaultValues: initialData,
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  async function onSubmit(values: RegistrationInput) {
    if (submitting.current) return;
    clearErrors();
    setServerError(null);
    const parsed = createRegistrationSchema(props).safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        setError(issue.path.join('.') as Parameters<typeof setError>[0], { type: 'validate', message: labels.invalidField });
      }
      setServerError(labels.invalidForm);
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        const code = (result.reason ?? result.code) as keyof typeof labels.errors;
        const message = labels.errors[code] ?? labels.errors.INTERNAL_ERROR;
        const field = typeof result.field === 'string' ? result.field : '';
        const memberField = /^members\.(\d+)\.(fullName|email|phone|institution|classLevel|studentId)$/.exec(field);
        const scalarField = field === 'teamName' || field === 'notes';
        const label = memberField ? labels[memberField[2] as keyof MemberInput] : scalarField ? labels[field as 'teamName' | 'notes'] : null;
        const detail = label ? `${label}: ${message}` : message;
        setServerError(typeof result.memberIndex === 'number' ? `${labels.member} ${result.memberIndex + 1}: ${detail}` : detail);
        if (memberField || scalarField) {
          setError(field as Parameters<typeof setError>[0], { type: 'server', message: labels.invalidField }, { shouldFocus: true });
        } else if (code === 'MEMBER_ALREADY_REGISTERED' && typeof result.memberIndex === 'number') {
          setError(`members.${result.memberIndex}.email`, { type: 'server', message }, { shouldFocus: true });
        }
        return;
      }
      router.refresh();
      // maybe add a success toast here
    } catch {
      setServerError(labels.errors.NETWORK_ERROR);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={event => void handleSubmit(onSubmit)(event)} noValidate className="space-y-6 text-left">
      {serverError && <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{serverError}</p>}
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        {isTeam && <label className="block space-y-2">
          <span>{labels.teamName} *</span>
          <input {...register('teamName')} maxLength={40} className={inputClass} aria-invalid={!!errors.teamName} />
          {errors.teamName && <span className="block text-sm text-danger">{errors.teamName.message}</span>}
        </label>}
        <AnimatePresence initial={false}>
          {fields.map((field, index) => (
            <motion.section layout key={field.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} className="min-w-0 space-y-4 rounded-xl border border-border bg-surface/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold">{isTeam ? index === 0 ? labels.leader : `${labels.member} ${index + 1}` : labels.yourInformation}</h4>
                {isTeam && index > 0 && fields.length > teamMinSize && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>{labels.remove}</Button>
                )}
              </div>
              {(['fullName', 'email', 'phone', 'institution', 'classLevel', 'studentId'] as const).map(name => {
                const optional = name === 'studentId' || (name === 'phone' && index > 0);
                const error = errors.members?.[index]?.[name];
                return <label key={name} className="block space-y-1">
                  <span className="text-sm">{labels[name]} {optional ? `(${labels.optional})` : '*'}</span>
                  {name === 'classLevel' ? (
                    <select {...register(`members.${index}.classLevel`)} className={inputClass} aria-invalid={!!error}>
                      {classLevels.map(value => <option key={value} value={value}>{value === 'other' ? labels.other : value}</option>)}
                    </select>
                  ) : (
                    <input {...register(`members.${index}.${name}`)} className={inputClass}
                      type={name === 'email' ? 'email' : name === 'phone' ? 'tel' : 'text'}
                      readOnly={name === 'email' && index === 0} required={!optional}
                      maxLength={name === 'fullName' || name === 'institution' ? 80 : undefined}
                      aria-invalid={!!error} />
                  )}
                  {error && <span className="block text-sm text-danger">{error.message}</span>}
                </label>;
              })}
            </motion.section>
          ))}
        </AnimatePresence>
        {isTeam && fields.length < teamMaxSize && (
          <Button type="button" variant="secondary" className="w-full" onClick={() => append(blankMember())}>{labels.addMember}</Button>
        )}
        <label className="block space-y-1">
          <span className="text-sm">{labels.notes} ({labels.optional})</span>
          <textarea {...register('notes')} maxLength={500} className={inputClass} />
          {errors.notes && <span className="text-sm text-danger">{errors.notes.message}</span>}
        </label>
        <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
          {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
        </Button>
      </fieldset>
    </form>
  );
}

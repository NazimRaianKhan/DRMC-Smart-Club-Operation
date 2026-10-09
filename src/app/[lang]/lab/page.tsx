import { LabClient } from '@/components/lab/LabClient';
import { getDictionary } from '@/i18n';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Concurrency Lab',
  description: 'Test the concurrent registration robustness of the system.',
};

export const instant = false;

type Props = {
  params: Promise<{ lang: 'en' | 'bn' }>;
};

export default async function LabPage({ params }: Props) {
  const { lang } = await params;
  return (
    <main className="flex-1 pb-32">
      <div className="container max-w-4xl px-4 md:px-6 py-12">
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl font-bold font-heading">
            {lang === 'bn' ? 'কনকারেন্সি ল্যাব' : 'Concurrency Lab'}
          </h1>
          <p className="text-lg text-text-muted">
            {lang === 'bn' ? 
              'এই পৃষ্ঠাটি দেখায় কীভাবে সিস্টেমটি একসঙ্গে অনেক রেজিস্ট্রেশন পরিচালনা করে। ইভেন্টের ক্যাপাসিটি ৫০-এ সেট করা আছে। সিস্টেমের স্থিতিশীলতা প্রমাণ করতে ৫০, ১০০, বা ২০০টি রেজিস্ট্রেশন একসঙ্গে ফায়ার করুন।' : 
              'This page demonstrates how the system handles concurrent registrations without overselling. The lab event capacity is set to 50. Fire 50, 100, or 200 simultaneous registrations to prove the invariants hold.'}
          </p>
        </div>
        
        <LabClient lang={lang} />
      </div>
    </main>
  );
}


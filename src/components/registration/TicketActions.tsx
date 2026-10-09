'use client';

import { Printer, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TicketActions({ lang, calendarUrl }: { lang: string, calendarUrl: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 print:hidden">
      <Button 
        onClick={() => window.print()} 
        variant="secondary" 
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        {lang === 'bn' ? 'টিকিট প্রিন্ট / সেভ করুন' : 'Print / Save ticket'}
      </Button>
      
      <Button 
        variant="secondary"
        className="gap-2"
        asChild
      >
        <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4" />
          {lang === 'bn' ? 'গুগল ক্যালেন্ডারে যোগ করুন' : 'Add to Google Calendar'}
        </a>
      </Button>
    </div>
  );
}


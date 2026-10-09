'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/forms';
import { Sparkles, MessageCircle, X } from 'lucide-react';

export function EventQaAssistant({ eventId, lang }: { eventId: string, lang: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, question, lang })
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.code);
      setAnswer(json.data?.answer || 'Failed to get answer');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} className="gap-2 rounded-full shadow-md">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <span className={lang === 'bn' ? 'font-bn' : ''}>{lang === 'bn' ? 'এই ইভেন্ট সম্পর্কে প্রশ্ন করুন' : 'Ask about this event'}</span>
      </Button>
    );
  }

  return (
    <div className="bg-surface border border-border shadow-lg rounded-xl overflow-hidden flex flex-col max-w-sm w-full">
      <div className="bg-emerald-500/10 p-3 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span className={`font-semibold text-sm ${lang === 'bn' ? 'font-bn' : ''}`}>{lang === 'bn' ? 'এআই অ্যাসিস্ট্যান্ট' : 'AI Assistant'}</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="p-4 bg-surface-alt/30 min-h-[120px] max-h-[300px] overflow-y-auto">
        {!answer && !loading && !error && (
          <p className={`text-sm text-muted-foreground text-center mt-6 ${lang === 'bn' ? 'font-bn' : ''}`}>
            {lang === 'bn' ? 'ইভেন্ট সম্পর্কে যেকোনো প্রশ্ন জিজ্ঞাসা করুন!' : 'Ask me anything about this event!'}
          </p>
        )}
        
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center mt-8">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
            <span>{lang === 'bn' ? 'চিন্তা করছে...' : 'Thinking...'}</span>
          </div>
        )}

        {error && (
          <p className="text-sm text-danger text-center mt-6">{error}</p>
        )}

        {answer && (
          <div className="flex gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className={`text-sm ${lang === 'bn' ? 'font-bn' : ''}`}>{answer}</p>
          </div>
        )}
      </div>

      <form onSubmit={askQuestion} className="p-3 border-t border-border flex gap-2">
        <Input 
          value={question} 
          onChange={e => setQuestion(e.target.value)} 
          placeholder={lang === 'bn' ? 'প্রশ্ন...' : 'Ask a question...'} 
          className={`flex-1 ${lang === 'bn' ? 'font-bn' : ''}`}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !question.trim()} size="sm">
          {lang === 'bn' ? 'পাঠান' : 'Ask'}
        </Button>
      </form>
    </div>
  );
}


'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/forms';

type ResultStatus = 'IDLE' | 'SUCCESS' | 'ALREADY_CHECKED_IN' | 'WRONG_EVENT' | 'NOT_CONFIRMED' | 'NOT_FOUND' | 'ERROR';

export function Scanner({ events, lang }: { events: any[], lang: string }) {
  const [eventId, setEventId] = useState(events[0]?.id || '');
  const [manualCode, setManualCode] = useState('');
  const [status, setStatus] = useState<ResultStatus>('IDLE');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    if (!scanning || cameraError) return;
    let stream: MediaStream | null = null;
    let requestAnimationFrameId: number;
    let lastRead = 0;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.play();
          requestAnimationFrameId = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError(true);
        setScanning(false);
      }
    }

    function tick() {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
          
          if (code && Date.now() - lastRead > 2000) {
             lastRead = Date.now();
             handleCheckIn(code.data);
          }
        }
      }
      requestAnimationFrameId = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(requestAnimationFrameId);
    };
  }, [scanning, cameraError]);

  const handleCheckIn = async (code: string) => {
    if (!eventId || !code.trim()) return;
    setStatus('IDLE');
    setManualCode('');
    
    try {
      const res = await fetch('/api/admin/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, code })
      });
      const json = await res.json();
      
      if (json.ok) {
        setStatus('SUCCESS');
      } else {
        setStatus(json.code as ResultStatus);
      }
    } catch (err) {
      setStatus('ERROR');
    }
    
    // Clear status after 3 seconds
    setTimeout(() => {
      setStatus('IDLE');
    }, 3000);
  };

  const getStatusColor = () => {
    switch(status) {
      case 'SUCCESS': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'ALREADY_CHECKED_IN': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'WRONG_EVENT': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
      case 'NOT_CONFIRMED': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
      case 'NOT_FOUND': return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
      case 'ERROR': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
      default: return 'hidden';
    }
  };

  const getStatusMessage = () => {
    switch(status) {
      case 'SUCCESS': return lang === 'bn' ? 'সফলভাবে চেক-ইন হয়েছে!' : 'Check-in Successful!';
      case 'ALREADY_CHECKED_IN': return lang === 'bn' ? 'ইতোমধ্যেই চেক-ইন করা হয়েছে!' : 'Already Checked In!';
      case 'WRONG_EVENT': return lang === 'bn' ? 'ভুল ইভেন্ট!' : 'Wrong Event!';
      case 'NOT_CONFIRMED': return lang === 'bn' ? 'রেজিস্ট্রেশন কনফার্মড নয়!' : 'Registration Not Confirmed!';
      case 'NOT_FOUND': return lang === 'bn' ? 'টিকিট পাওয়া যায়নি!' : 'Ticket Not Found!';
      case 'ERROR': return 'Network error';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      {/* Event Selection */}
      <div className="bg-surface border border-border p-6 rounded-2xl">
        <label className="block text-sm font-medium mb-2">{lang === 'bn' ? 'ইভেন্ট নির্বাচন করুন' : 'Select Event'}</label>
        <select 
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full h-12 rounded-lg border border-border bg-bg px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {lang === 'bn' ? ev.titleBn || ev.title : ev.title}
            </option>
          ))}
        </select>
      </div>

      {/* Banner */}
      {status !== 'IDLE' && (
        <div className={`p-6 rounded-2xl border text-center ${getStatusColor()}`}>
          <h2 className="text-2xl font-bold font-heading">{getStatusMessage()}</h2>
        </div>
      )}

      {/* Scanner */}
      <div className="bg-surface border border-border p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{lang === 'bn' ? 'QR স্ক্যানার' : 'QR Scanner'}</h3>
          <Button 
            onClick={() => { setScanning(!scanning); setCameraError(false); }} 
            variant={scanning ? "danger" : "primary"}
          >
            {scanning ? (lang === 'bn' ? 'স্ক্যানার বন্ধ করুন' : 'Stop Scanner') : (lang === 'bn' ? 'স্ক্যানার চালু করুন' : 'Start Scanner')}
          </Button>
        </div>

        {cameraError && (
          <div className="p-4 bg-danger/10 text-danger rounded-xl text-sm">
            {lang === 'bn' ? 'ক্যামেরা অ্যাক্সেস করা যাচ্ছে না। দয়া করে অনুমতি দিন বা ম্যানুয়াল ইনপুট ব্যবহার করুন।' : 'Cannot access camera. Please allow permissions or use manual input.'}
          </div>
        )}

        <div className="relative w-full aspect-square max-w-sm mx-auto overflow-hidden rounded-xl bg-black border-2 border-border">
          {!scanning && <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">Camera inactive</div>}
          <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`} />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Manual Input */}
      <div className="bg-surface border border-border p-6 rounded-2xl">
        <label className="block text-sm font-medium mb-2">{lang === 'bn' ? 'ম্যানুয়াল টিকিট কোড' : 'Manual Ticket Code'}</label>
        <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(manualCode); }} className="flex gap-2">
          <Input 
            value={manualCode} 
            onChange={e => setManualCode(e.target.value.toUpperCase())} 
            placeholder="e.g. A1B2C3D4" 
            className="flex-1 font-mono uppercase"
          />
          <Button type="submit" disabled={!manualCode || !eventId}>
            {lang === 'bn' ? 'চেক-ইন' : 'Check-in'}
          </Button>
        </form>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useRef } from 'react';
import { useFxConfig } from '@/lib/fx';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export function ParticleField() {
  const { particlesEnabled } = useFxConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!particlesEnabled || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    const MAX_PARTICLES = 45;
    const CONNECT_DIST = 120;
    const MOUSE_ATTRACT_DIST = 150;
    
    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    
    let mouseX = -1000;
    let mouseY = -1000;

    const resize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      
      width = rect.width;
      height = rect.height;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
      
      initParticles();
    };

    const initParticles = () => {
      particles = Array.from({ length: MAX_PARTICLES }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    };

    const updateParticles = () => {
      for (const p of particles) {
        // Pointer attraction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < MOUSE_ATTRACT_DIST) {
          const force = (MOUSE_ATTRACT_DIST - dist) / MOUSE_ATTRACT_DIST;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        // Friction to cap speed
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Base drift if moving too slow
        if (Math.abs(p.vx) < 0.1) p.vx += (Math.random() - 0.5) * 0.05;
        if (Math.abs(p.vy) < 0.1) p.vy += (Math.random() - 0.5) * 0.05;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]!;
          const p2 = particles[j]!;
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.15;
            
            // Brighten if near cursor
            const p1MouseDist = Math.sqrt(Math.pow(p1.x - mouseX, 2) + Math.pow(p1.y - mouseY, 2));
            const p2MouseDist = Math.sqrt(Math.pow(p2.x - mouseX, 2) + Math.pow(p2.y - mouseY, 2));
            const hoverBoost = (p1MouseDist < MOUSE_ATTRACT_DIST || p2MouseDist < MOUSE_ATTRACT_DIST) ? 0.3 : 0;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha + hoverBoost})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6, 182, 212, ${p.alpha})`;
        ctx.fill();
      }
    };

    const loop = () => {
      if (isVisible) {
        updateParticles();
        drawParticles();
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    // Setup ResizeObserver
    const ro = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    // Setup IntersectionObserver
    const io = new IntersectionObserver((entries) => {
      if (entries[0]) isVisible = entries[0].isIntersecting;
    });
    io.observe(canvas);

    // Track mouse on window
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    const onMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    resize();
    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [particlesEnabled]);

  if (!particlesEnabled) {
    // Fallback static background
    return <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />;
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none" 
      aria-hidden="true" 
    />
  );
}


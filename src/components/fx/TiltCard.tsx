'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useFxConfig } from '@/lib/fx';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className = '' }: TiltCardProps) {
  const { tiltEnabled } = useFxConfig();
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [0, 1], [6, -6]);
  const rotateY = useTransform(springX, [0, 1], [-6, 6]);

  const backgroundPx = useTransform(springX, (v) => `${v * 100}%`);
  const backgroundPy = useTransform(springY, (v) => `${v * 100}%`);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    x.set(rx);
    y.set(ry);
  };

  const handlePointerEnter = () => {
    if (tiltEnabled) setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  const bgRadial = `radial-gradient(400px circle at var(--cx) var(--cy), rgba(6,182,212,0.1), transparent 40%)`;
  const bgConic = `conic-gradient(from 180deg at var(--cx) var(--cy), rgba(6,182,212,0.8), rgba(250,204,21,0.5), rgba(6,182,212,0.8))`;
  const bgSurface = `radial-gradient(circle at var(--cx) var(--cy), rgba(6,182,212,0.4), transparent 50%)`;

  if (!tiltEnabled) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
        willChange: isHovered ? 'transform' : 'auto',
        // Pass cursor pos to CSS vars for pseudo-element masks
        '--cx': backgroundPx,
        '--cy': backgroundPy,
      } as any}
      className={`relative group ${className}`}
    >
      {/* Neon border and surface flashlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: bgRadial,
          zIndex: 1,
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"
        style={{
          background: bgConic,
          filter: 'blur(4px)',
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-0.5 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-20"
        style={{
          background: bgSurface,
        }}
      />
      {children}
    </motion.div>
  );
}


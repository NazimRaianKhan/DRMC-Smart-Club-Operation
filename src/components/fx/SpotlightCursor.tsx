'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { useFxConfig } from '@/lib/fx';

export function SpotlightCursor() {
  const { spotlightEnabled } = useFxConfig();
  const [isVisible, setIsVisible] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth easing for the glow dot
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const background = useMotionTemplate`radial-gradient(600px circle at ${cursorXSpring}px ${cursorYSpring}px, rgba(6,182,212,0.1), transparent 40%)`;

  useEffect(() => {
    if (!spotlightEnabled) {
      setIsVisible(false);
      return;
    }

    const moveCursor = (e: PointerEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handlePointerLeave = () => setIsVisible(false);
    const handlePointerEnter = () => setIsVisible(true);

    window.addEventListener('pointermove', moveCursor);
    document.documentElement.addEventListener('pointerleave', handlePointerLeave);
    document.documentElement.addEventListener('pointerenter', handlePointerEnter);

    return () => {
      window.removeEventListener('pointermove', moveCursor);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
      document.documentElement.removeEventListener('pointerenter', handlePointerEnter);
    };
  }, [spotlightEnabled, cursorX, cursorY, isVisible]);

  if (!spotlightEnabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Soft radial glow */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          background,
        }}
      />
      {/* Solid dot */}
      <motion.div
        className="absolute h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] z-10"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />
    </div>
  );
}

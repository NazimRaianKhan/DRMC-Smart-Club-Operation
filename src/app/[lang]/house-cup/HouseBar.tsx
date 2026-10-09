'use client';

import { motion } from 'framer-motion';

export function HouseBar({ color, percentage }: { color: string; percentage: number }) {
  return (
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="h-full rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}80` }}
    />
  );
}


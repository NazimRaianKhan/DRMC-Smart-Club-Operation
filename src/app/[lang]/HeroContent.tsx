'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { t } from '@/i18n/utils';

export function HeroContent({ dict, lang }: { dict: any; lang: string }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="max-w-3xl space-y-6 relative z-10"
    >
      <motion.div variants={item}>
        <Badge>New in 2026</Badge>
      </motion.div>
      <motion.h1 variants={item} className="text-5xl md:text-7xl font-bold font-heading text-accent-2 tracking-tight">
        {t(dict, 'landing.heroTitle')}
      </motion.h1>
      <motion.p variants={item} className="text-xl md:text-2xl text-text-muted">
        {t(dict, 'landing.heroSubtitle')}
      </motion.p>
      <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Button size="lg" asChild>
          <Link href={`/${lang}/fests`}>{t(dict, 'landing.browseFests')}</Link>
        </Button>
        <Button size="lg" variant="secondary" asChild>
          <a href="#how-it-works">{t(dict, 'landing.howItWorks')}</a>
        </Button>
      </motion.div>
    </motion.div>
  );
}


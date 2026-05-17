'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(idx: number) {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  }

  return (
    <div className="divide-y divide-[#BBC8D4] rounded-2xl border border-[#BBC8D4] bg-white overflow-hidden">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(idx)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-start transition-colors hover:bg-[#F9FBFD]"
            >
              <span className="font-semibold text-sm text-[#003449]">{item.question}</span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-[#6D7D8B] transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-5 pt-1 text-sm leading-relaxed text-[#6D7D8B]">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

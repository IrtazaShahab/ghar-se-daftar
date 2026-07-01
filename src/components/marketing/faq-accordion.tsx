"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
};

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openItem, setOpenItem] = useState(0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {items.map((item, index) => {
        const isOpen = openItem === index;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-[24px] border border-border bg-white/80 shadow-[0_18px_50px_rgba(53,47,34,0.06)] transition hover:border-accent/70"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-7"
              onClick={() => setOpenItem(isOpen ? -1 : index)}
            >
              <span className="font-serif text-xl font-semibold leading-snug text-foreground md:text-2xl">
                {item.question}
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-primary shadow-sm transition">
                {isOpen ? <Minus className="size-5" /> : <Plus className="size-5" />}
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-6 leading-8 text-muted md:px-7">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

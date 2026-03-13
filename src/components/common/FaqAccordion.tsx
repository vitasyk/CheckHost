
'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
    id: number | string;
    question: string;
    answer: string;
}

interface FaqAccordionProps {
    items: FaqItem[];
    title?: string;
    titleTag?: 'h2' | 'h3' | 'h4' | 'h5';
    headingLevel?: 'h2' | 'h3' | 'h4' | 'h5';
}

export function FaqAccordion({ items, title, titleTag = 'h2', headingLevel = 'h3' }: FaqAccordionProps) {
    const [openId, setOpenId] = useState<number | string | null>(null);

    if (!items || items.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mx-auto my-12 px-4">
            {title && (
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                        <HelpCircle className="h-5 w-5" />
                    </div>
                    {React.createElement(titleTag, {
                        className: "text-2xl font-bold text-slate-900 dark:text-white"
                    }, title)}
                </div>
            )}
            <div className="space-y-3">
                {items.map((item) => {
                    const isOpen = openId === item.id;
                    return (
                        <div
                            key={item.id}
                            className={`group border rounded-2xl transition-all duration-300 ${isOpen
                                ? 'border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/5 shadow-md shadow-indigo-500/5'
                                : 'border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/10'
                                }`}
                        >
                            <button
                                onClick={() => setOpenId(isOpen ? null : item.id)}
                                className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                            >
                                {(() => {
                                    const Heading = headingLevel;
                                    return (
                                        <Heading className={`font-semibold text-[15px] transition-colors duration-300 ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'
                                            }`}>
                                            {item.question}
                                        </Heading>
                                    );
                                })()}
                                <div className={`p-1 rounded-full transition-all duration-300 ${isOpen ? 'bg-indigo-500 text-white rotate-180' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-500'
                                    }`}>
                                    <ChevronDown className="h-4 w-4" />
                                </div>
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-5 pt-0 text-[14px] leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/[0.03] mt-2">
                                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: item.answer }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

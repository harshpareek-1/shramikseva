import React from 'react';
import { Profession } from '../types.ts';
import { Zap, Wrench, Hammer, Paintbrush, Sparkles, Mic } from 'lucide-react';

interface LowLiteracyHeroProps {
  selectedProfession?: Profession | 'All';
  onSelectProfession: (profession: Profession | 'All') => void;
  onSelectQuickPrompt: (promptText: string) => void;
  isListening: boolean;
  onToggleVoiceSearch: () => void;
}

const CATEGORIES: {
  profession: Profession;
  icon: React.ReactNode;
  title: string;
  hindiSub: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}[] = [
  {
    profession: 'Electrician',
    icon: <Zap className="w-8 h-8 text-amber-600" />,
    title: 'Electrician',
    hindiSub: 'बिजली / AC / वायरिंग',
    bgColor: 'bg-amber-50/80 hover:bg-amber-100/90',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-950',
  },
  {
    profession: 'Plumber',
    icon: <Wrench className="w-8 h-8 text-sky-600" />,
    title: 'Plumber',
    hindiSub: 'नल / पाइप लीकेज',
    bgColor: 'bg-sky-50/80 hover:bg-sky-100/90',
    borderColor: 'border-sky-200',
    textColor: 'text-sky-950',
  },
  {
    profession: 'Carpenter',
    icon: <Hammer className="w-8 h-8 text-orange-600" />,
    title: 'Carpenter',
    hindiSub: 'फर्नीचर / दरवाजा',
    bgColor: 'bg-orange-50/80 hover:bg-orange-100/90',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-950',
  },
  {
    profession: 'Painter',
    icon: <Paintbrush className="w-8 h-8 text-emerald-600" />,
    title: 'Painter',
    hindiSub: 'दीवार रंग / पुट्टी',
    bgColor: 'bg-emerald-50/80 hover:bg-emerald-100/90',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-950',
  },
  {
    profession: 'Cleaner',
    icon: <Sparkles className="w-8 h-8 text-purple-600" />,
    title: 'Cleaner / Maid',
    hindiSub: 'सफाई / घरेलू काम',
    bgColor: 'bg-purple-50/80 hover:bg-purple-100/90',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-950',
  },
];

const QUICK_PROMPTS = [
  { label: '❄️ AC Repair / Servicing', query: 'AC repair near me' },
  { label: '🚰 Kitchen Pipe Leakage', query: 'Emergency plumber for pipe leakage' },
  { label: '🚨 Emergency Worker Now', query: 'Emergency worker available now' },
  { label: '🪑 Furniture Assembly', query: 'Carpenter for furniture assembly' },
  { label: '🧹 Full House Deep Cleaning', query: 'Deep cleaning domestic helper today' },
];

export const LowLiteracyHero: React.FC<LowLiteracyHeroProps> = ({
  selectedProfession,
  onSelectProfession,
  onSelectQuickPrompt,
  isListening,
  onToggleVoiceSearch,
}) => {
  return (
    <div className="bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent pt-6 pb-4 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Visual Banner Header with Voice Tap */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Find Trusted Local Workers</span>
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified Skills
              </span>
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Choose the work you need. We find and rank the most suitable workers near you.
            </p>
          </div>

          {/* Big Voice Button for low-literacy users */}
          <button
            onClick={onToggleVoiceSearch}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-md transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-amber-500/20'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span>{isListening ? 'Listening... Speak Now' : 'Tap & Speak What You Need'}</span>
          </button>
        </div>

        {/* 5 Big High-Contrast Visual Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map(cat => {
            const isSelected = selectedProfession === cat.profession;
            return (
              <button
                key={cat.profession}
                onClick={() => onSelectProfession(isSelected ? 'All' : cat.profession)}
                className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 transition-all text-center relative ${
                  isSelected
                    ? 'border-amber-600 bg-white ring-4 ring-amber-500/20 shadow-md scale-[1.02]'
                    : `${cat.borderColor} ${cat.bgColor} shadow-xs hover:shadow-sm`
                }`}
              >
                {/* Visual Icon Badge */}
                <div className="mb-2 p-2 rounded-xl bg-white shadow-xs">{cat.icon}</div>
                <span className={`font-extrabold text-base ${cat.textColor}`}>{cat.title}</span>
                <span className="text-xs font-semibold text-slate-500 mt-0.5">{cat.hindiSub}</span>
                {isSelected && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 1-Tap Ready Problem / Prompt Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="font-bold text-slate-400 uppercase tracking-wider shrink-0 text-[11px]">
            Common Tasks:
          </span>
          {QUICK_PROMPTS.map(item => (
            <button
              key={item.label}
              onClick={() => onSelectQuickPrompt(item.query)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium shadow-2xs hover:border-amber-300 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

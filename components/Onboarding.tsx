import React, { useState } from 'react';
import { GraduationCap, BookOpen, Brain, Zap, Shield, ChevronRight, Users } from 'lucide-react';

const slides = [
  {
    icon: GraduationCap,
    color: '#00f2fe',
    title: 'Welcome to GPA Study Hub',
    subtitle: 'GTU Diploma EC & ICT',
    desc: 'Your complete academic companion for Diploma Engineering — built for Gujarat students, 100% offline.',
    bg: 'radial-gradient(circle at 60% 30%, rgba(0,242,254,0.15), transparent 60%)',
  },
  {
    icon: BookOpen,
    color: '#fbbf24',
    title: 'Exam Hub & Library',
    subtitle: 'Past Papers · MCQs · Resources',
    desc: 'Access GTU past question papers, MCQ banks, study notes and faculty-uploaded resources — all offline.',
    bg: 'radial-gradient(circle at 40% 60%, rgba(251,191,36,0.15), transparent 60%)',
  },
  {
    icon: Brain,
    color: '#a855f7',
    title: 'AI Tutor',
    subtitle: 'Ask Any Doubt, Anytime',
    desc: 'Get instant explanations for any subject topic. Powered by Gemini AI — your personal 24/7 tutor.',
    bg: 'radial-gradient(circle at 70% 40%, rgba(168,85,247,0.15), transparent 60%)',
  },
  {
    icon: Zap,
    color: '#10b981',
    title: 'Attendance & Planner',
    subtitle: 'Stay on Track',
    desc: 'Track your attendance percentage, plan assignments, set exam reminders — never miss 75% again.',
    bg: 'radial-gradient(circle at 30% 70%, rgba(16,185,129,0.15), transparent 60%)',
  },
  {
    icon: Shield,
    color: '#00f2fe',
    title: 'Secure. Free. Yours.',
    subtitle: 'RBAC · Offline · Private',
    desc: 'Student, Faculty and Admin each get their own secure space. All data stays on your device — no cloud, no cost.',
    bg: 'radial-gradient(circle at 50% 50%, rgba(0,242,254,0.12), transparent 60%)',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx] || slides[0]!;
  const Icon = slide.icon;
  const isLast = idx === slides.length - 1;

  const next = () => {
    if (isLast) { onComplete(); }
    else { setIdx(i => i + 1); }
  };

  const skip = () => onComplete();

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between relative overflow-hidden p-6 pb-10"
      style={{ background: 'linear-gradient(135deg, #050810 0%, #0a1020 100%)' }}
    >
      {/* Dynamic glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{ background: slide.bg }}
      />

      {/* Skip */}
      <div className="w-full flex justify-end relative z-10">
        {!isLast && (
          <button
            onClick={skip}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-2 px-3 min-h-[40px]"
          >
            Skip
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-sm text-center gap-8">
        {/* Icon */}
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{
            background: `linear-gradient(135deg, ${slide.color}22, ${slide.color}44)`,
            border: `2px solid ${slide.color}40`,
            boxShadow: `0 0 60px ${slide.color}25`,
          }}
        >
          <Icon className="w-14 h-14" style={{ color: slide.color }} />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <div
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: slide.color }}
          >
            {slide.subtitle}
          </div>
          <h1 className="text-3xl font-black text-white leading-tight">
            {slide.title}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            {slide.desc}
          </p>
        </div>

        {/* Stats row on last slide */}
        {isLast && (
          <div className="flex gap-4 w-full">
            {[
              { val: '2000+', label: 'Students' },
              { val: '100%', label: 'Offline' },
              { val: '₹0', label: 'Cost' },
            ].map(s => (
              <div
                key={s.label}
                className="flex-1 rounded-2xl py-3 text-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="text-xl font-black" style={{ color: '#00f2fe' }}>{s.val}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-sm relative z-10 space-y-5">
        {/* Dots */}
        <div className="flex gap-2 justify-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="rounded-full transition-all duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                background: i === idx ? slide.color : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>

        {/* Next / Get Started button */}
        <button
          onClick={next}
          className="w-full py-4 min-h-[56px] rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${slide.color}, ${slide.color}bb)`,
            color: '#040810',
            boxShadow: `0 12px 32px ${slide.color}35`,
          }}
        >
          {isLast ? (
            <><Users className="w-5 h-5" /> Get Started</>
          ) : (
            <>Next <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};

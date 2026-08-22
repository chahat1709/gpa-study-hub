import React, { useState } from 'react';
import { ArrowRight, BookOpen, Check, GraduationCap, LayoutDashboard, ShieldCheck } from 'lucide-react';

const slides = [
  { eyebrow: 'Student workspace', title: 'A calmer way to stay on top of college.', desc: 'One focused workspace for your schedule, attendance, exams, library, and daily study plan.', icon: GraduationCap, accent: 'mint' },
  { eyebrow: 'Everything in one place', title: 'Know what needs your attention.', desc: 'See upcoming exams, attendance risk, notices, and your next study action without hunting through menus.', icon: LayoutDashboard, accent: 'violet' },
  { eyebrow: 'Built around your routine', title: 'Start with your next step.', desc: 'Use the Exam Hub, AI Tutor, Planner, and Library when you need them. Your workspace is private and offline-first.', icon: ShieldCheck, accent: 'coral' },
];

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [idx, setIdx] = useState(0);
  const slide = slides[idx] || slides[0]!;
  const Icon = slide.icon;
  const last = idx === slides.length - 1;
  return (
    <main className={`onboarding onboarding-${slide.accent}`}>
      <div className="onboarding-top"><div className="onboarding-brand"><div className="onboarding-logo"><GraduationCap /></div><span>GPA Study Hub</span></div>{!last && <button className="onboarding-skip" onClick={onComplete}>Skip introduction</button>}</div>
      <section className="onboarding-content"><div className="onboarding-icon"><Icon /></div><p className="onboarding-eyebrow">{slide.eyebrow}</p><h1>{slide.title}</h1><p className="onboarding-desc">{slide.desc}</p>{last && <div className="onboarding-points"><span><Check /> GTU-ready</span><span><Check /> Offline-first</span><span><Check /> Free to use</span></div>}</section>
      <div className="onboarding-bottom"><div className="onboarding-progress" aria-label={`Step ${idx + 1} of ${slides.length}`}>{slides.map((_, i) => <button key={i} className={i === idx ? 'is-active' : ''} onClick={() => setIdx(i)} aria-label={`Go to step ${i + 1}`} />)}</div><button className="onboarding-next" onClick={() => last ? onComplete() : setIdx(i => i + 1)}>{last ? <>Open my workspace <ArrowRight /></> : <>Continue <ArrowRight /></>}</button><p><BookOpen /> Designed for GTU EC & ICT students</p></div>
    </main>
  );
};

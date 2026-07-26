import React from 'react';
import { AppMode } from '../types';
import { LayoutGrid, GraduationCap, MessageCircle, Library, User, Award } from 'lucide-react';
import { hapticFeedback } from '../utils/haptic';

interface BottomNavProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentMode, onModeChange }) => {
  const navItems = [
    { mode: AppMode.CAMPUS, icon: LayoutGrid, label: 'Home', ariaLabel: 'Navigate to Campus Home' },
    { mode: AppMode.EXAM_HUB, icon: Award, label: 'Exams', ariaLabel: 'Navigate to Exam Hub', badge: 'GTU' },
    { mode: AppMode.TUTOR, icon: GraduationCap, label: 'Tutor', ariaLabel: 'Navigate to AI Tutor' },
    { mode: AppMode.SOCIAL, icon: MessageCircle, label: 'Chat', ariaLabel: 'Navigate to Social Chat' },
    { mode: AppMode.PROFILE, icon: User, label: 'Profile', ariaLabel: 'Navigate to Profile' },
  ];

  const handleNavClick = (mode: AppMode) => {
    hapticFeedback('selection');
    onModeChange(mode);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 pb-[env(safe-area-inset-bottom)] px-4 flex justify-center pb-4 pointer-events-none">
      <nav 
        className="stitch-nav pointer-events-auto flex justify-around items-center h-[64px] w-full max-w-sm px-2 shadow-2xl relative"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              role="tab"
              aria-selected={isActive}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleNavClick(item.mode)}
              className="flex-1 flex flex-col items-center justify-center h-full active:scale-95 transition-all duration-300 relative group focus:outline-none rounded-full"
            >
              <div 
                className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center relative ${
                  isActive 
                    ? 'bg-stitch-primary-container shadow-inner shadow-stitch-primary/30 text-white' 
                    : 'text-slate-400 group-hover:text-stitch-primary'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && !isActive && (
                  <span className="absolute 0 right-0 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" aria-hidden="true" />
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 transition-colors tracking-wide ${
                isActive ? 'text-stitch-primary' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;

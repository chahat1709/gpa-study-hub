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
    {
      mode: AppMode.EXAM_HUB,
      icon: Award,
      label: 'Exams',
      ariaLabel: 'Navigate to Exam Hub',
      badge: 'GTU',
    },
    { mode: AppMode.TUTOR, icon: GraduationCap, label: 'Tutor', ariaLabel: 'Navigate to AI Tutor' },
    {
      mode: AppMode.SOCIAL,
      icon: MessageCircle,
      label: 'Chat',
      ariaLabel: 'Navigate to Social Chat',
    },
    { mode: AppMode.PROFILE, icon: User, label: 'Profile', ariaLabel: 'Navigate to Profile' },
  ];

  const handleNavClick = (mode: AppMode) => {
    hapticFeedback('selection');
    onModeChange(mode);
  };

  return (
    <div className="ui-mobile-dock md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4">
      <nav
        className="rounded-full mx-auto w-full max-w-[420px] px-3 py-2 flex items-center justify-between gap-1 pointer-events-auto"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map(item => {
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
              className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 group focus:outline-none ${isActive ? 'is-active' : 'hover:text-white hover:bg-white/10'}`}
            >
              <div className="flex flex-col items-center justify-center relative">
                <Icon
                  className={`w-[24px] h-[24px] transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`}
                />
                {item.badge && !isActive && (
                  <span
                    className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(233,196,0,0.8)]"
                    aria-hidden="true"
                  />
                )}
                {!isActive && (
                  <span
                    className={`text-[9px] font-bold mt-0.5 tracking-wide text-white/50 group-hover:text-white/80 transition-colors`}
                  >
                    {item.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;

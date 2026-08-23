/**
 * Shared input styles used across AuthPage and ForgotPin.
 */
import React from 'react';

export const inputCls =
  'w-full px-4 py-3.5 min-h-[52px] rounded-2xl outline-none text-white placeholder-slate-500/80 text-sm font-medium transition-all duration-300';

export const inputStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
};

export function btnPrimary(
  colorStart: string,
  colorEnd: string,
  shadowColor: string
): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${colorStart}, ${colorEnd})`,
    boxShadow: `0 8px 24px ${shadowColor}50, inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
  };
}

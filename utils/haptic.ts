/**
 * Haptic Feedback Utility
 * Provides tactile feedback on mobile devices using the Vibration API
 * Falls back gracefully on devices without vibration support
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 10],
  error: [30, 50, 30],
  selection: 5,
};

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback
 */
export function hapticFeedback(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Silently fail - vibration may be blocked by browser settings
  }
}

/**
 * Create a click handler with haptic feedback
 * Usage: <button onClick={withHaptic(() => doSomething())}>
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  pattern: HapticPattern = 'light'
): T {
  return ((...args: any[]) => {
    hapticFeedback(pattern);
    return handler(...args);
  }) as T;
}

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  return {
    feedback: hapticFeedback,
    light: () => hapticFeedback('light'),
    medium: () => hapticFeedback('medium'),
    heavy: () => hapticFeedback('heavy'),
    success: () => hapticFeedback('success'),
    error: () => hapticFeedback('error'),
    selection: () => hapticFeedback('selection'),
    isSupported: isHapticSupported(),
  };
}

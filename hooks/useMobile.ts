import { useState, useEffect, useRef } from 'react';

export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  const updateInsets = useRef(() => {
    const style = getComputedStyle(document.documentElement);
    setInsets({
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
    });
  });

  useEffect(() => {
    updateInsets.current();
    window.addEventListener('resize', updateInsets.current);
    window.addEventListener('orientationchange', () => setTimeout(updateInsets.current, 100));
    return () => {
      window.removeEventListener('resize', updateInsets.current);
      window.removeEventListener('orientationchange', updateInsets.current);
    };
  }, []);

  return insets;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const check = () => setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', () => setTimeout(check, 100));
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return orientation;
}

export function usePullToRefresh(onRefresh: () => Promise<void>, enabled = true) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0]) {
        startY.current = e.touches[0]!.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY.current > 0 && e.touches[0]) {
        const distance = e.touches[0]!.clientY - startY.current;
        if (distance > 0) {
          e.preventDefault();
          setPullDistance(Math.min(distance, 100));
          setIsPulling(distance > 60);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && pullDistance > 60) {
        await onRefresh();
      }
      startY.current = 0;
      setPullDistance(0);
      setIsPulling(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isPulling, pullDistance, onRefresh]);

  return { isPulling, pullDistance };
}
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { cursorStore } from '../../lib/cursorStore';

// Magnetic cursor with trail, spring physics, and element attraction
export default function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const stretchRef = useRef({ x: 1, y: 1 });
  const angleRef = useRef(0);
  const trailPositions = useRef<Array<{ x: number; y: number; age: number }>>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.matchMedia('(max-width: 768px)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize trail positions
  useEffect(() => {
    trailPositions.current = Array.from({ length: 20 }, () => ({ x: 0, y: 0, age: 0 }));
  }, []);

  // Magnetic attraction to interactive elements
  const findNearestInteractive = useCallback((x: number, y: number) => {
    const elements = document.querySelectorAll(
      'button, a, [data-magnetic], input, textarea, select, .glass-card, .liquid-glass, .magnetic-btn, [role="button"]'
    );
    let nearest = null;
    let nearestDist = Infinity;
    let nearestCenter = { x: 0, y: 0 };

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

      const magnetRadius = 150;
      if (dist < magnetRadius && dist < nearestDist) {
        nearestDist = dist;
        nearest = el;
        nearestCenter = { x: centerX, y: centerY };
      }
    });

    return nearest ? { element: nearest, center: nearestCenter, distance: nearestDist } : null;
  }, []);

  // Unified physics + render loop
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      cursorStore.update(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };

    const handleMouseDown = () => setIsPressed(true);
    const handleMouseUp = () => setIsPressed(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'button, a, [data-magnetic], input, textarea, select, .glass-card, .liquid-glass, .magnetic-btn, [role="button"]'
        )
      ) {
        setIsHovering(true);
        cursorStore.setHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(
          'button, a, [data-magnetic], input, textarea, select, .glass-card, .liquid-glass, .magnetic-btn, [role="button"]'
        )
      ) {
        setIsHovering(false);
        cursorStore.setHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    // Initialize trail canvas
    const canvas = trailRef.current;
    const ctx = canvas?.getContext('2d');

    // Spring physics + render loop
    const springK = 0.12;
    const damping = 0.82;

    const animate = () => {
      const pos = posRef.current;
      const vel = velRef.current;
      const target = targetRef.current;

      // Find nearest interactive element for magnetic pull
      const nearest = findNearestInteractive(pos.x, pos.y);
      let magneticForce = { x: 0, y: 0 };

      if (nearest) {
        const dx = nearest.center.x - pos.x;
        const dy = nearest.center.y - pos.y;
        const dist = nearest.distance;
        const strength = Math.max(0, 1 - dist / 150) * 0.3;
        magneticForce = { x: dx * strength, y: dy * strength };
      }

      // Spring force towards target + magnetic pull
      const fx = (target.x - pos.x) * springK + magneticForce.x;
      const fy = (target.y - pos.y) * springK + magneticForce.y;

      // Update velocity with damping
      vel.x = (vel.x + fx) * damping;
      vel.y = (vel.y + fy) * damping;

      // Update position
      pos.x += vel.x;
      pos.y += vel.y;

      // Velocity-based stretch
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      const stretchAmount = Math.min(speed * 0.02, 0.4);
      angleRef.current = Math.atan2(vel.y, vel.x);
      stretchRef.current = {
        x: 1 + stretchAmount,
        y: 1 - stretchAmount * 0.5,
      };

      // Update trail positions
      trailPositions.current.unshift({ x: pos.x, y: pos.y, age: 0 });
      if (trailPositions.current.length > 20) {
        trailPositions.current.pop();
      }
      trailPositions.current.forEach(p => p.age++);

      // Update main cursor with stretch + rotation
      if (cursorRef.current) {
        const deg = angleRef.current * (180 / Math.PI);
        cursorRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) rotate(${deg}deg) scale(${stretchRef.current.x}, ${stretchRef.current.y})`;
      }

      // Update glow
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
      }

      // Render trail on canvas
      if (canvas && ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        trailPositions.current.forEach((trailPos, i) => {
          const opacity = Math.max(0, 1 - trailPos.age / 20);
          const radius = Math.max(0.5, (6 - i * 0.3) * opacity);

          // Glow
          const grad = ctx.createRadialGradient(
            trailPos.x,
            trailPos.y,
            0,
            trailPos.x,
            trailPos.y,
            radius * 3
          );
          grad.addColorStop(0, `rgba(128, 131, 255, ${opacity * 0.4})`);
          grad.addColorStop(1, `rgba(128, 131, 255, 0)`);
          ctx.beginPath();
          ctx.arc(trailPos.x, trailPos.y, radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(trailPos.x, trailPos.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(192, 193, 255, ${opacity * 0.8})`;
          ctx.fill();
        });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isMobile, findNearestInteractive]);

  if (isMobile) return null;

  return (
    <>
      {/* Particle trail canvas */}
      <canvas
        ref={trailRef}
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Glow effect */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          width: isPressed ? '60px' : isHovering ? '50px' : '40px',
          height: isPressed ? '60px' : isHovering ? '50px' : '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128, 131, 255, 0.15) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          transition:
            'width 0.3s cubic-bezier(0.23, 1, 0.32, 1), height 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
          filter: 'blur(8px)',
        }}
      />

      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          width: isPressed ? '8px' : isHovering ? '12px' : '6px',
          height: isPressed ? '8px' : isHovering ? '12px' : '6px',
          borderRadius: '50%',
          background: isHovering
            ? 'radial-gradient(circle, #5de6ff 0%, #8083ff 100%)'
            : 'radial-gradient(circle, #c0c1ff 0%, #8083ff 100%)',
          transform: 'translate(-50%, -50%)',
          transition:
            'width 0.3s cubic-bezier(0.23, 1, 0.32, 1), height 0.3s cubic-bezier(0.23, 1, 0.32, 1), background 0.3s',
          boxShadow: isHovering
            ? '0 0 20px rgba(93, 230, 255, 0.6), 0 0 40px rgba(128, 131, 255, 0.3)'
            : '0 0 10px rgba(128, 131, 255, 0.4)',
        }}
      />
    </>
  );
}

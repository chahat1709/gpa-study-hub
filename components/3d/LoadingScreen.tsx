import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  // Canvas particle system with Verlet integration + orbital mechanics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: number[];
      orbitRadius: number;
      orbitSpeed: number;
      orbitAngle: number;
    }

    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 0.5,
      color: Math.random() > 0.5 ? [128, 131, 255] : [93, 230, 255],
      orbitRadius: Math.random() * 150 + 50,
      orbitSpeed: (Math.random() - 0.5) * 0.02,
      orbitAngle: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      particles.forEach(p => {
        // Orbital motion around center
        p.orbitAngle += p.orbitSpeed;
        const targetX = cx + Math.cos(p.orbitAngle) * p.orbitRadius;
        const targetY = cy + Math.sin(p.orbitAngle) * p.orbitRadius;

        // Verlet integration
        const tempX = p.x;
        const tempY = p.y;
        p.x += (p.x - p.vx) * 0.98 + (targetX - p.x) * 0.001;
        p.y += (p.y - p.vy) * 0.98 + (targetY - p.y) * 0.001;
        p.vx = tempX - p.x;
        p.vy = tempY - p.y;

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        grad.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.8)`);
        grad.addColorStop(1, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.9)`;
        ctx.fill();
      });

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          if (!pi || !pj) continue;
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(128, 131, 255, ${0.15 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 1.1,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: onComplete,
        });
      },
    });

    // Logo entrance
    tl.fromTo(
      logoRef.current,
      { scale: 0, rotation: -180, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 1, ease: 'back.out(1.7)' }
    );

    // Text reveal
    tl.fromTo(
      textRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    );

    // Progress bar animation
    tl.to(
      {},
      {
        duration: 1.5,
        onUpdate: function () {
          setProgress(Math.round(this.progress() * 100));
        },
      },
      '-=0.3'
    );

    // Particle burst
    tl.to(logoRef.current, {
      scale: 1.2,
      duration: 0.2,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)',
      }}
    >
      {/* Canvas particle system */}
      <canvas ref={canvasRef} className="absolute inset-0" style={{ opacity: 0.7 }} />

      {/* Logo */}
      <div ref={logoRef} className="relative mb-8 z-10" style={{ opacity: 0 }}>
        <div className="w-24 h-24 relative">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid rgba(128, 131, 255, 0.3)',
              animation: 'spin 8s linear infinite',
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute inset-2 rounded-full"
            style={{
              border: '2px solid rgba(93, 230, 255, 0.4)',
              animation: 'spin 6s linear infinite reverse',
            }}
          />
          {/* Core */}
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #8083ff 0%, #5de6ff 100%)',
              boxShadow: '0 0 30px rgba(128, 131, 255, 0.5), 0 0 60px rgba(93, 230, 255, 0.3)',
              animation: 'glow-pulse 2s ease-in-out infinite',
            }}
          />
          {/* GPA Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-white font-bold text-xl"
              style={{
                textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
              }}
            >
              GPA
            </span>
          </div>
        </div>
      </div>

      {/* Text */}
      <div ref={textRef} className="text-center mb-8 z-10" style={{ opacity: 0 }}>
        <h1 className="text-3xl font-bold text-white mb-2">Study Hub</h1>
        <p className="text-gray-400 text-sm">Loading your experience...</p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden z-10">
        <div
          ref={progressRef}
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #8083ff 0%, #5de6ff 100%)',
            boxShadow: '0 0 10px rgba(128, 131, 255, 0.5)',
          }}
        />
      </div>

      {/* Progress text */}
      <div className="mt-4 text-gray-500 text-sm font-mono z-10">{progress}%</div>
    </div>
  );
}

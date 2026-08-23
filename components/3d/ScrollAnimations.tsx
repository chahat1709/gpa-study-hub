import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollAnimations() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Wait for DOM
    const timer = setTimeout(() => {
      // Glass card reveal with depth + scrub
      gsap.utils.toArray('.glass-card, .liquid-glass, .card-3d, .glass-tab').forEach((el: any) => {
        gsap.fromTo(
          el,
          {
            opacity: 0,
            rotateX: 8,
            y: 60,
            scale: 0.92,
            transformPerspective: 800,
          },
          {
            opacity: 1,
            rotateX: 0,
            y: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top 95%',
              end: 'top 40%',
              scrub: 0.8,
            },
          }
        );
      });

      // Character-by-character reveal for headings
      gsap.utils.toArray('[data-animate="chars"]').forEach((el: any) => {
        const text = el.textContent;
        el.innerHTML = '';
        [...text].forEach((char: string) => {
          const span = document.createElement('span');
          span.textContent = char === ' ' ? '\u00A0' : char;
          span.style.display = 'inline-block';
          span.style.opacity = '0';
          el.appendChild(span);
        });

        gsap.set(el.children, { opacity: 0, y: 20, rotateX: -90 });

        gsap.to(el.children, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.03,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      // Standard header animation (fallback for non-animated headings)
      gsap.utils.toArray('h2, h3').forEach((el: any) => {
        if (el.dataset.animate === 'chars') return; // Skip if using char animation
        gsap.fromTo(
          el,
          {
            opacity: 0,
            y: 40,
            skewY: 3,
          },
          {
            opacity: 1,
            y: 0,
            skewY: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // Parallax background blobs
      gsap.utils.toArray('.bg-blob-1, .bg-blob-2').forEach((el: any, i) => {
        gsap.to(el, {
          y: () => (i === 0 ? -150 : 150),
          x: () => (i === 0 ? 50 : -50),
          ease: 'none',
          scrollTrigger: {
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.5,
          },
        });
      });

      // Scroll-linked continuous parallax for data-parallax elements
      gsap.utils.toArray('[data-parallax]').forEach((el: any) => {
        const speed = parseFloat(el.dataset.parallax) || 0.5;
        gsap.fromTo(
          el,
          { y: 100 * speed },
          {
            y: -100 * speed,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          }
        );
      });

      // Button hover animations
      gsap.utils.toArray('button, [role="button"], .magnetic-btn').forEach((el: any) => {
        el.addEventListener('mouseenter', () => {
          gsap.to(el, {
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        el.addEventListener('mouseleave', () => {
          gsap.to(el, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        el.addEventListener('mousedown', () => {
          gsap.to(el, {
            scale: 0.95,
            duration: 0.1,
            ease: 'power2.out',
          });
        });

        el.addEventListener('mouseup', () => {
          gsap.to(el, {
            scale: 1.05,
            duration: 0.1,
            ease: 'power2.out',
          });
        });
      });

      // Input focus animations
      gsap.utils.toArray('input, textarea, select').forEach((el: any) => {
        el.addEventListener('focus', () => {
          gsap.to(el, {
            scale: 1.02,
            duration: 0.3,
            ease: 'power2.out',
            boxShadow: '0 0 20px rgba(128, 131, 255, 0.3)',
          });
        });

        el.addEventListener('blur', () => {
          gsap.to(el, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            boxShadow: '0 0 0px rgba(128, 131, 255, 0)',
          });
        });
      });

      // Success feedback animation
      window.addEventListener('success-feedback', ((e: CustomEvent) => {
        const { x, y } = e.detail;
        const particle = document.createElement('div');
        particle.className = 'fixed pointer-events-none z-[10000]';
        particle.innerHTML = '✓';
        particle.style.cssText = `
          left: ${x}px;
          top: ${y}px;
          color: #10b981;
          font-size: 24px;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        `;
        document.body.appendChild(particle);

        gsap.fromTo(
          particle,
          { scale: 0, opacity: 1 },
          {
            scale: 1.5,
            opacity: 0,
            y: -50,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => particle.remove(),
          }
        );
      }) as EventListener);
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return null;
}

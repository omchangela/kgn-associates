'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { KgnCrest, ApprovedValuerBadge, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const containerRef = useRef(null);
  const crestRef = useRef(null);
  const titleRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    // GSAP entrance animation for splash screen
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        crestRef.current,
        { scale: 0.7, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.9 }
      )
        .fromTo(
          titleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          '-=0.4'
        )
        .fromTo(
          barRef.current,
          { width: '0%' },
          { width: '100%', duration: 1.2, ease: 'power2.inOut' },
          '-=0.3'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fb 50%, #f1f5f9 100%)',
        overflow: 'hidden',
      }}
    >
      <ArchitecturalGridSvg />

      {/* Ambient Gold Glow Halo */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184, 134, 11, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, padding: '24px' }}>
        <div ref={crestRef} style={{ display: 'inline-block', marginBottom: '24px' }}>
          <KgnCrest size={80} />
        </div>

        <div ref={titleRef}>
          <div style={{ marginBottom: '12px' }}>
            <ApprovedValuerBadge />
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '2px',
              color: 'var(--primary-gold)',
              margin: '0 0 8px 0',
              textShadow: '0 2px 12px rgba(184, 134, 11, 0.2)',
            }}
          >
            KGN ASSOCIATES
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              letterSpacing: '1px',
              margin: 0,
              fontWeight: 600,
            }}
          >
            Engineers and Valuers
          </p>
        </div>

        {/* Animated Loading Bar */}
        <div
          style={{
            width: '240px',
            height: '4px',
            background: 'rgba(148, 163, 184, 0.25)',
            borderRadius: '999px',
            margin: '36px auto 14px',
            overflow: 'hidden',
          }}
        >
          <div
            ref={barRef}
            style={{
              height: '100%',
              background: 'var(--gradient-gold)',
              borderRadius: '999px',
              boxShadow: '0 0 12px rgba(184, 134, 11, 0.6)',
            }}
          />
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.5px', fontWeight: 500 }}>
          Initializing Valuation Engine...
        </p>
      </div>
    </div>
  );
}

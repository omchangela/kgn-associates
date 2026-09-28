'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      background: '#F3F4F6'
    }}>
      <div style={{ textAlign: 'center' }}>
        <img src="/logo.png" alt="KGN Associates" style={{ width: '120px', margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1F2937' }}>KGN Associates Property Valuation</h2>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '8px' }}>Loading portal...</p>
      </div>
    </div>
  );
}

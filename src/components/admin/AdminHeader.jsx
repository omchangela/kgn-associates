'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ShieldCheck, UserCheck, ArrowUpRight } from 'lucide-react';

export default function AdminHeader({ onMenuToggle, title = 'Executive Administration' }) {
  return (
    <header style={{
      height: '68px',
      background: 'rgba(10, 14, 24, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
            }}
          >
            <Menu size={22} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: 'var(--primary-gold)',
            fontSize: '0.78rem',
            fontWeight: '700',
            textTransform: 'uppercase',
          }}>
            <ShieldCheck size={13} />
            <span>Admin</span>
          </span>
          <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.95rem' }}>
            {title}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            fontSize: '0.82rem',
            fontWeight: '500',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
        >
          <span>View Employee Panel</span>
          <ArrowUpRight size={14} />
        </Link>

        {/* Profile Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 12px',
          borderRadius: '8px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #D4B07A 0%, #C28B52 100%)',
            color: '#0A0D14',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '0.85rem',
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff', lineHeight: 1.1 }}>
              admin@admin.com
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary-gold)' }}>
              Super Administrator
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

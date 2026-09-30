'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, ShieldCheck, UserCheck, ArrowUpRight } from 'lucide-react';

export default function AdminHeader({ onMenuToggle, title = 'Executive Administration' }) {
  return (
    <header style={{
      height: '68px',
      background: '#ffffff',
      borderBottom: '1px solid rgba(148, 163, 184, 0.25)',
      boxShadow: '0 1px 8px rgba(0, 0, 0, 0.05)',
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
              color: '#1e293b',
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
            background: 'rgba(184, 134, 11, 0.12)',
            border: '1px solid rgba(184, 134, 11, 0.3)',
            color: 'var(--primary-gold)',
            fontSize: '0.78rem',
            fontWeight: '700',
            textTransform: 'uppercase',
          }}>
            <ShieldCheck size={13} />
            <span>Admin</span>
          </span>
          <span style={{ color: '#1e293b', fontWeight: '700', fontSize: '0.95rem' }}>
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
            padding: '7px 14px',
            borderRadius: '6px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '0.82rem',
            fontWeight: '600',
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
          padding: '6px 14px',
          borderRadius: '8px',
          background: '#f8fafc',
          border: '1px solid rgba(184, 134, 11, 0.3)',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #B8860B 0%, #D4A017 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '0.85rem',
          }}>
            A
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.1 }}>
              admin@admin.com
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary-gold)', fontWeight: '600' }}>
              Super Administrator
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

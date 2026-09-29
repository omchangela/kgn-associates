'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AdminSidebar.module.css';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ArrowLeftRight, 
  LogOut, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { KgnCrest } from '@/components/common/SvgDecorations';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (path) => pathname === path;

  const handleAdminLogout = () => {
    if (logout) logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/admin/login');
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div>
        {/* Brand */}
        <Link href="/admin/dashboard" className={styles.brandRow} onClick={onClose}>
          <KgnCrest size={40} />
          <div>
            <span className={styles.brandTitle}>KGN ASSOCIATES</span>
            <span className={styles.brandSub}>Administration</span>
          </div>
        </Link>

        {/* Admin Badge */}
        <div className={styles.adminBadgePill}>
          <ShieldCheck size={14} />
          <span>Executive Console</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <span className={styles.navSectionLabel}>Administration</span>

          <Link
            href="/admin/dashboard"
            className={`${styles.navItem} ${isActive('/admin/dashboard') ? styles.active : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} className={styles.navIcon} />
            <span>Admin Dashboard</span>
          </Link>

          <Link
            href="/admin/employees"
            className={`${styles.navItem} ${isActive('/admin/employees') ? styles.active : ''}`}
            onClick={onClose}
          >
            <Users size={18} className={styles.navIcon} />
            <span>Employee Management</span>
          </Link>

          <span className={styles.navSectionLabel}>Portals &amp; Views</span>

          <Link
            href="/dashboard"
            className={styles.navItem}
            onClick={onClose}
          >
            <ArrowLeftRight size={18} className={styles.navIcon} />
            <span>Switch to Employee Panel</span>
          </Link>
        </nav>
      </div>

      {/* Footer Box */}
      <div className={styles.footerBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', fontSize: '0.8rem', color: '#94a3b8' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span>System Online &bull; v2.6</span>
        </div>

        <button 
          onClick={handleAdminLogout} 
          className={styles.logoutBtn}
        >
          <LogOut size={16} />
          <span>Admin Logout</span>
        </button>
      </div>
    </aside>
  );
}

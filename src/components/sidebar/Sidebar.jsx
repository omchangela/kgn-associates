'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import { LayoutDashboard, FilePlus, ListChecks, Building2 } from 'lucide-react';
import { KgnCrest } from '@/components/common/SvgDecorations';

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div>
          {/* Brand Logo & Title */}
          <div className={styles.logoContainer}>
            <Link href="/dashboard" className={styles.brandRow} onClick={onClose}>
              <KgnCrest size={42} />
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>KGN ASSOCIATES</span>
                <span className={styles.brandSub}>Approved Valuers</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className={styles.nav}>
            <span className={styles.navLabel}>Core Console</span>

            <Link
              href="/dashboard"
              className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`}
              onClick={onClose}
            >
              <LayoutDashboard size={20} className={styles.navIcon} />
              <span>Valuation Dashboard</span>
            </Link>

            <Link
              href="/property-values"
              className={`${styles.navItem} ${isActive('/property-values') ? styles.active : ''}`}
              onClick={onClose}
            >
              <Building2 size={20} className={styles.navIcon} />
              <span>Property Values (10-Tab)</span>
            </Link>

            <Link
              href="/create-report"
              className={`${styles.navItem} ${isActive('/create-report') ? styles.active : ''}`}
              onClick={onClose}
            >
              <FilePlus size={20} className={styles.navIcon} />
              <span>Fast Report Intake</span>
            </Link>

            <Link
              href="/report-list"
              className={`${styles.navItem} ${isActive('/report-list') ? styles.active : ''}`}
              onClick={onClose}
            >
              <ListChecks size={20} className={styles.navIcon} />
              <span>Certificates &amp; Reports</span>
            </Link>
          </nav>
        </div>

        {/* Footer status pill */}
        <div className={styles.sidebarFooter}>
          <div className={styles.systemBadge}>
            <span className={styles.statusIndicator} />
            <div className={styles.systemText}>
              <span className={styles.systemTitle}>Valuation Engine v2.6</span>
              <span className={styles.systemSub}>IBBI &amp; Banking Mode</span>
            </div>
          </div>
        </div>
      </aside>

      {isOpen && <div className={styles.overlay} onClick={onClose} />}
    </>
  );
};

export default Sidebar;
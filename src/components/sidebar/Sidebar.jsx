'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';
import {
  LayoutDashboard,
  FilePlus,
  ListChecks,
  Building2,
  Users,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { KgnCrest } from '@/components/common/SvgDecorations';

const NAV_SECTIONS = [
  {
    label: 'Core Console',
    items: [
      { href: '/dashboard',       icon: LayoutDashboard, label: 'Valuation Dashboard' },
      { href: '/property-values', icon: Building2,        label: 'Property Values',       badge: '10-Tab' },
      { href: '/create-report',   icon: FilePlus,         label: 'Fast Report Intake' },
      { href: '/report-list',     icon: ListChecks,       label: 'Certificates & Reports' },
      { href: '/employees',       icon: Users,            label: 'Valuers & Staff' },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const isActive = (path) => pathname === path;

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>

        {/* ── Brand ── */}
        <div className={styles.logoContainer}>
          <Link href="/dashboard" className={styles.brandRow} onClick={onClose}>
            <KgnCrest size={40} />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>KGN ASSOCIATES</span>
              <span className={styles.brandSub}>Engineers &amp; Valuers</span>
            </div>
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className={styles.navGroup}>
              <div className={styles.navLabel}>{section.label}</div>

              {section.items.map(({ href, icon: Icon, label, badge }) => (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navItem} ${isActive(href) ? styles.active : ''}`}
                  onClick={onClose}
                >
                  <Icon size={18} className={styles.navIcon} />
                  <span>{label}</span>
                  {badge && <span className={styles.navBadge}>{badge}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Footer Status Badge ── */}
        <div className={styles.sidebarFooter}>
          <div className={styles.systemBadge}>
            <div className={styles.statusIndicatorWrap}>
              <span className={styles.statusIndicator} />
              <span className={styles.statusRing} />
            </div>
            <div className={styles.systemText}>
              <span className={styles.systemTitle}>Valuation Engine v2.6</span>
              <span className={styles.systemSub}>IBBI &amp; Banking Mode</span>
            </div>
            <div className={styles.versionDot} />
          </div>
        </div>
      </aside>

      {isOpen && <div className={styles.overlay} onClick={onClose} />}
    </>
  );
};

export default Sidebar;

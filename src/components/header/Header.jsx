'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { ChevronDown, User, Menu, LogOut, Shield, Phone, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ROUTE_LABELS = {
  '/dashboard':       'Valuation Dashboard',
  '/property-values': 'Property Values',
  '/create-report':   'Fast Report Intake',
  '/report-list':     'Certificates & Reports',
  '/employees':       'Valuers & Staff',
};

const Header = ({ onMenuToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    return user?.username || 'Chartered Valuer';
  };

  const getInitials = () =>
    getDisplayName()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const pageLabel = ROUTE_LABELS[pathname] || 'Dashboard';

  return (
    <header className={styles.header}>
      {/* Left */}
      <div className={styles.leftControls}>
        <button className={styles.menuButton} onClick={onMenuToggle} aria-label="Toggle Navigation">
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <span>KGN Associates</span>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{pageLabel}</span>
        </div>

        {/* Status pill */}
        <div className={styles.statusPill}>
          <span className="status-dot-active" />
          <span>Valuation Engine Active</span>
        </div>
      </div>

      {/* Right */}
      <div className={styles.rightControls}>
        {/* Notification Bell */}
        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={17} />
        </button>

        <div className={styles.headerDivider} />

        {/* User Dropdown */}
        <div className={styles.userSection} ref={dropdownRef}>
          <div className={styles.profileWrapper} onClick={() => setIsOpen(!isOpen)}>
            <div className={styles.iconCircle}>
              {getInitials() || <User size={16} />}
            </div>

            <div className={styles.userMeta}>
              <span className={styles.userName}>{getDisplayName()}</span>
              <span className={styles.userRole}>{user?.role || 'Admin'}</span>
            </div>

            <ChevronDown size={15} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
          </div>

          {isOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownHeaderName}>{getDisplayName()}</div>
                <div className={styles.dropdownHeaderEmail}>{user?.email || 'admin@kgnassociates.com'}</div>
              </div>

              <div className={styles.dropdownItem}>
                <Shield size={15} color="var(--primary-gold)" />
                <span>Role: {user?.role?.toUpperCase() || 'ADMIN'}</span>
              </div>

              {user?.phone_number && (
                <div className={styles.dropdownItem}>
                  <Phone size={15} color="var(--primary-gold)" />
                  <span>{user.phone_number}</span>
                </div>
              )}

              <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={handleLogout}>
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

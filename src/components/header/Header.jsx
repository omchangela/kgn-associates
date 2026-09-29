'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { ChevronDown, User, Menu, Mail, Phone, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ApprovedValuerBadge } from '@/components/common/SvgDecorations';

const Header = ({ onMenuToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Close dropdown on click outside
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
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'Chartered Valuer';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftControls}>
        <button className={styles.menuButton} onClick={onMenuToggle} aria-label="Toggle Navigation">
          <Menu size={22} />
        </button>

        <div className={styles.statusPill}>
          <span className="status-dot-active" />
          <span>Valuation Engine Active</span>
        </div>
      </div>

      <div className={styles.rightControls}>
        <div style={{ display: 'none' }} className="hidden md:block">
          <ApprovedValuerBadge size={16} />
        </div>

        <div className={styles.userSection} ref={dropdownRef}>
          <div className={styles.profileWrapper} onClick={() => setIsOpen(!isOpen)}>
            <div className={styles.iconCircle}>
              {getInitials() || <User size={18} />}
            </div>

            <div className={styles.userMeta}>
              <span className={styles.userName}>{getDisplayName()}</span>
              <span className={styles.userRole}>{user?.role || 'Approved Valuer'}</span>
            </div>

            <ChevronDown size={16} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
          </div>

          {isOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownHeaderName}>{getDisplayName()}</div>
                <div className={styles.dropdownHeaderEmail}>{user?.email || 'admin@kgnassociates.com'}</div>
              </div>

              <div className={styles.dropdownItem}>
                <Shield size={16} color="var(--primary-gold)" />
                <span>Role: {user?.role?.toUpperCase() || 'APPROVED VALUER'}</span>
              </div>

              {user?.phone_number && (
                <div className={styles.dropdownItem}>
                  <Phone size={16} color="var(--primary-gold)" />
                  <span>{user.phone_number}</span>
                </div>
              )}

              <button className={`${styles.dropdownItem} ${styles.logout}`} onClick={handleLogout}>
                <LogOut size={16} />
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
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { ChevronDown, User, Menu, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Header = ({ onMenuToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'Valuer';
  };

  return (
    <header className={styles.header}>
      <button className={styles.menuButton} onClick={onMenuToggle}>
        <Menu size={24} />
      </button>
      
      <div className={styles.userSection} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.profileWrapper}>
          <div className={styles.iconCircle}>
            <User size={20} color="white" />
          </div>
          
          <span className={styles.userName}>{getDisplayName()}</span>
          <ChevronDown size={18} className={isOpen ? styles.rotate : ''} />
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            <button>PROFILE: {user?.role?.toUpperCase() || 'VALUER'}</button>
            <button>
              <Phone size={14} />
              <span>{user?.phone_number || 'No phone'}</span>
            </button>
            <button>
              <Mail size={14} />
              <span>{user?.email || 'No email'}</span>
            </button>
            <button className={styles.logout} onClick={handleLogout}>LOGOUT</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
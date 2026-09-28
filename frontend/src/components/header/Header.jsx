import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { ChevronDown, User, Menu, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
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
            <button>EDIT PROFILE</button>
            <button>
              <Phone size={14} />
              <span>Not Available</span>
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
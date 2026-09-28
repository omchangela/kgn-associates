import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { LayoutDashboard, FilePlus, List, Home } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoPill}>
            KGN Associates
          </div>
        </div>
        
        <nav className={styles.nav}>
          <Link to="/dashboard" className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`} onClick={onClose}>
            <LayoutDashboard size={20} />
            <span>DashBoard</span>
          </Link>
          <Link to="/property-values" className={`${styles.navItem} ${isActive('/property-values') ? styles.active : ''}`} onClick={onClose}>
            <Home size={20} />
            <span>Property Values</span>
          </Link>
          <Link to="/create-report" className={`${styles.navItem} ${isActive('/create-report') ? styles.active : ''}`} onClick={onClose}>
            <FilePlus size={20} />
            <span>Create Report</span>
          </Link>
          <Link to="/report-list" className={`${styles.navItem} ${isActive('/report-list') ? styles.active : ''}`} onClick={onClose}>
            <List size={20} />
            <span>Report List</span>
          </Link>
        </nav>
      </aside>
      
      {isOpen && <div className={`${styles.overlay} ${styles.active}`} onClick={onClose}></div>}
    </>
  );
};

export default Sidebar;
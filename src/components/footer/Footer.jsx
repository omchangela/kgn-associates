import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ margin: 0 }}>
          &copy; 2026 <strong>KGN ASSOCIATES</strong>. All Rights Reserved. Chartered Engineers &amp; Approved Valuers.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>IBBI Regulated Standards</span>
          <span>•</span>
          <span style={{ color: 'var(--primary-gold)' }}>Valuation Portal Engine v2.6</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
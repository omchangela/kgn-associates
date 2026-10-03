import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ margin: 0, textAlign: 'center', width: '100%', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <strong>KGN ASSOCIATES</strong><br/>
          Engineers and Valuers
        </p>
      </div>
    </footer>
  );
};

export default Footer;
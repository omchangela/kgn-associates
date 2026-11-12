'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminLogin.module.css';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        `.${styles.loginContainer}`,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          requireAdmin: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Authentication failed. Administrator privileges required.');
      }

      if (data.access) {
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
      }

      // Update auth context
      if (login) {
        await login({ email: formData.email, password: formData.password });
      }

      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper} ref={containerRef}>
      <div className={styles.loginContainer}>
        {/* Left Branding Panel */}
        <div className={styles.leftPanel}>
          <div>
            <h1 className={styles.adminHeading}>KGN ASSOCIATES</h1>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={styles.rightPanel}>
          <h2 className={styles.adminTitle}>Admin Sign In</h2>
          <p className={styles.portalSubtitle}>
            Enter administrator credentials to manage the platform
          </p>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className={styles.form} style={{ marginTop: error ? '16px' : '0' }} autoComplete="off">
            <div className={styles.inputGroup}>
              <label className={styles.label}>Admin Email or Username</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  name="email"
                  className={styles.input}
                  placeholder="Enter administrator ID or email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={styles.input}
                  placeholder="Enter administrator password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span>Authenticating Admin...</span>
              ) : (
                <>
                  <span>Enter Admin Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className={styles.footerRow}>
              <Link href="/login" className={styles.returnLink}>
                &larr; Return to Employee / Valuer Portal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

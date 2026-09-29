'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './AdminLogin.module.css';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Users, 
  FileText, 
  ArrowRight, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { KgnCrest, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';
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
      <ArchitecturalGridSvg />

      <div className={styles.loginContainer}>
        {/* Left Branding Panel */}
        <div className={styles.leftPanel}>
          <div>
            <div className={styles.brandBadge}>
              <ShieldCheck size={16} />
              <span>Administrative Console</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <KgnCrest size={64} />
              <div>
                <h1 className={styles.adminHeading}>
                  KGN <span>ADMIN</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '1px' }}>
                  CENTRAL CONTROL PANEL
                </p>
              </div>
            </div>

            <p className={styles.adminDesc}>
              Authorized personnel only. Access system metrics, employee provisioning, and valuation report certification.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Users size={18} />
                </div>
                <div>
                  <h4 className={styles.featureTitle}>Employee Management</h4>
                  <p className={styles.featureSub}>Create, activate, and manage valuers and field assessors.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className={styles.featureTitle}>Valuation Moderation</h4>
                  <p className={styles.featureSub}>Review, approve, or reject property appraisal dossiers.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <KeyRound size={18} />
                </div>
                <div>
                  <h4 className={styles.featureTitle}>Bank Compliance</h4>
                  <p className={styles.featureSub}>Audit-ready logs conforming to IBBI &amp; banking panel standards.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '24px' }}>
            KGN Associates &bull; Secure AES-256 Encrypted Session
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

          <form onSubmit={handleAdminLogin} className={styles.form} style={{ marginTop: error ? '16px' : '0' }}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Admin Email or Username</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="text"
                  name="email"
                  className={styles.input}
                  placeholder="admin@admin.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
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
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
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

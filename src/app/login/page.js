'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Login.module.css';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Calculator, FileCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { KgnCrest, ApprovedValuerBadge, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: 'admin', password: 'admin' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const formBoxRef = useRef(null);
  const featuresRef = useRef(null);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    // GSAP entrance animation for login screen
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        leftPanelRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8 }
      )
        .fromTo(
          formBoxRef.current,
          { scale: 0.94, opacity: 0, y: 20 },
          { scale: 1, opacity: 1, y: 0, duration: 0.7 },
          '-=0.5'
        );

      if (featuresRef.current) {
        tl.fromTo(
          featuresRef.current.children,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
          '-=0.4'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleFillDemo = () => {
    setFormData({ email: 'admin', password: 'admin' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    setLoading(true);
    setError('');

    try {
      const result = await login({ email, password });
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper} ref={containerRef}>
      <ArchitecturalGridSvg />

      <div className={styles.loginContainer}>
        {/* Left Side: Luxury Branding & Credentials */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelContent} ref={leftPanelRef}>
            <div className={styles.brandBadge}>
              <ApprovedValuerBadge size={18} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <KgnCrest size={64} />
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  ESTD. &amp; REGISTERED
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-gold)', margin: 0, fontSize: '1.4rem' }}>
                  CHARTERED VALUERS
                </h2>
              </div>
            </div>

            <div className={styles.welcomeText}>
              <p>Welcome to</p>
              <h1>KGN ASSOCIATES</h1>
            </div>

            <p className={styles.brandDescription}>
              Government Approved Valuers, Chartered Engineers, and Municipal Property Assessors. 
              Comprehensive land, building, and commercial valuation certification platform.
            </p>

            {/* Feature highlights with animated SVG icons */}
            <div className={styles.featureList} ref={featuresRef}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <ShieldCheck size={20} />
                </div>
                <div className={styles.featureText}>
                  <h4>Bank &amp; NBFC Standards Compliant</h4>
                  <p>Adheres strictly to State Bank, HDFC, ICICI &amp; IBBI valuation schedules.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <Calculator size={20} />
                </div>
                <div className={styles.featureText}>
                  <h4>Automated Rate &amp; Depreciation Matrix</h4>
                  <p>Auto-computes plinth rates, salvage ratios, and land area values instantly.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <FileCheck size={20} />
                </div>
                <div className={styles.featureText}>
                  <h4>Instant Certified PDF Generation</h4>
                  <p>Produces multi-page signed valuation dossiers with photo attachments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContent} ref={formBoxRef}>
            <h2 className={styles.adminTitle}>Valuer Sign In</h2>
            <p className={styles.portalSubtitle}>Access the Chartered Valuation Console</p>

            {/* Demo Quick-fill Pill */}
            <div className={styles.demoBox}>
              <div className={styles.demoText}>
                Demo: <strong>admin</strong> / <strong>admin</strong>
              </div>
              <button type="button" onClick={handleFillDemo} className={styles.demoButton}>
                Quick Fill
              </button>
            </div>

            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <Mail className={styles.inputIcon} size={20} />
                <input
                  type="text"
                  name="email"
                  placeholder="Username or Email"
                  className={styles.inputField}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <Lock className={styles.inputIcon} size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  className={styles.inputField}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <div className={styles.forgotContainer}>
                <a href="#forgot" className={styles.forgotLink}>Forgot Password?</a>
              </div>

              <button
                type="submit"
                className={`${styles.loginButton} btn-shimmer`}
                disabled={loading}
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Valuation Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className={styles.signupContainer}>
                <p className={styles.signupText}>
                  Need credentials?{' '}
                  <Link href="/signup" className={styles.signupLink}>
                    Register New Valuer
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

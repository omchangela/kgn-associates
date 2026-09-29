'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Signup.module.css';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import gsap from 'gsap';
import { KgnCrest, ApprovedValuerBadge, ArchitecturalGridSvg } from '@/components/common/SvgDecorations';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const leftPanelRef = useRef(null);
  const formBoxRef = useRef(null);

  const router = useRouter();
  const { register } = useAuth();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        leftPanelRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7 }
      ).fromTo(
        formBoxRef.current,
        { scale: 0.95, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6 },
        '-=0.4'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { username, first_name, last_name, email, phone_number, password, password2 } = formData;

    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register({ username, first_name, last_name, email, phone_number, password });
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper} ref={containerRef}>
      <ArchitecturalGridSvg />

      <div className={styles.signupContainer}>
        {/* Left Side: Branding */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelContent} ref={leftPanelRef}>
            <div className={styles.brandBadge}>
              <ApprovedValuerBadge size={18} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <KgnCrest size={64} />
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  VALUATION PORTAL
                </span>
                <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary-gold)', margin: 0, fontSize: '1.4rem' }}>
                  NEW VALUER ONBOARDING
                </h2>
              </div>
            </div>

            <div className={styles.welcomeText}>
              <p>Join the panel of</p>
              <h1>KGN ASSOCIATES</h1>
            </div>

            <p className={styles.brandDescription}>
              Join the registered roster of Chartered Engineers and Approved Property Valuers.
              Access advanced valuation matrices, bank-compliant reporting, and instant digital certification.
            </p>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContent} ref={formBoxRef}>
            <h2 className={styles.adminTitle}>Create Valuer Account</h2>
            <p className={styles.portalSubtitle}>Enter your professional details below</p>

            <form className={styles.form} onSubmit={handleSignup}>
              <div className={styles.gridTwo}>
                <div className={styles.inputGroup}>
                  <User className={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    className={styles.inputField}
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <User className={styles.inputIcon} size={18} />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    className={styles.inputField}
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={18} />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  className={styles.inputField}
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Official Email Address"
                  className={styles.inputField}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <Phone className={styles.inputIcon} size={18} />
                <input
                  type="tel"
                  name="phone_number"
                  placeholder="Contact Mobile Number"
                  className={styles.inputField}
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.inputGroup}>
                  <Lock className={styles.inputIcon} size={18} />
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
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className={styles.inputGroup}>
                  <Lock className={styles.inputIcon} size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="password2"
                    placeholder="Confirm Password"
                    className={styles.inputField}
                    value={formData.password2}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <button
                type="submit"
                className={`${styles.signupButton} btn-shimmer`}
                disabled={loading}
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Valuer Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className={styles.loginPrompt}>
                <p className={styles.loginPromptText}>
                  Already registered?{' '}
                  <Link href="/login" className={styles.loginLink}>
                    Sign In to Portal
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

export default Signup;

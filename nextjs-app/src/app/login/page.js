'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Login.module.css';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
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
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.loginContainer}>
        {/* Left Side: Branding */}
        <div className={styles.leftPanel}>
          <div className={styles.logoSection}>
            <img src="/logo.png" alt="Logo" className={styles.mainLogo} />
            <div className={styles.welcomeText}>
              <p>Welcome To</p>
              <h1>KGN ASSOCIATES</h1>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>
                Chartered Engineers & Approved Valuers
              </p>
            </div>
          </div>
          <div className={styles.bottomGlow}></div>
        </div>

        {/* Right Side: Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContent}>
            <h2 className={styles.adminTitle}>Valuation Portal Login</h2>
            
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <Mail className={styles.inputIcon} size={22} />
                <input 
                  type="text" 
                  name="email" 
                  placeholder="Email or Username" 
                  className={styles.inputField} 
                  value={formData.email}
                  onChange={handleChange} 
                  required 
                />
              </div>

              <div className={styles.inputGroup}>
                <Lock className={styles.inputIcon} size={22} />
                <input 
                  type={showPassword ? "text" : "password"} 
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
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <div className={styles.forgotContainer}>
                <a href="#forgot" className={styles.forgotLink}>Forgot Password?</a>
              </div>

              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className={styles.signupContainer}>
                <p className={styles.signupText}>
                  Don't have an account?{' '}
                  <Link href="/signup" className={styles.signupLink}>
                    Sign up
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

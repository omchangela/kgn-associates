'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Signup.module.css';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
    password2: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { register } = useAuth();

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
    <div className={styles.pageWrapper}>
      <div className={styles.signupContainer}>
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
            <h2 className={styles.adminTitle}>Create Account</h2>
            
            <form className={styles.form} onSubmit={handleSignup}>
              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={22} />
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className={styles.inputGroup}>
                  <input 
                    type="text" 
                    name="first_name"
                    placeholder="First Name" 
                    className={styles.inputField}
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <input 
                    type="text" 
                    name="last_name"
                    placeholder="Last Name" 
                    className={styles.inputField}
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <Mail className={styles.inputIcon} size={22} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email" 
                  className={styles.inputField}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <Phone className={styles.inputIcon} size={22} />
                <input 
                  type="tel" 
                  name="phone_number"
                  placeholder="Phone Number" 
                  className={styles.inputField}
                  value={formData.phone_number}
                  onChange={handleChange}
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

              <div className={styles.inputGroup}>
                <Lock className={styles.inputIcon} size={22} />
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
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
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && <p className={styles.errorMessage}>{error}</p>}

              <button type="submit" className={styles.signupButton} disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className={styles.loginContainer}>
                <p className={styles.loginText}>
                  Already have an account?{' '}
                  <Link href="/login" className={styles.loginLink}>
                    Log in
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

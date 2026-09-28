import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useAuth } from '../../context/AuthContext';

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '',
    first_name: '',
    last_name: '',
    email: '', 
    password: '', 
    password2: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { username, first_name, last_name, email, password, password2 } = formData;

    // Basic validation
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
      const result = await register({ username, first_name, last_name, email, password, password2 });
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.signupContainer}>
        {/* Left Side: Branding */}
        <div className={styles.leftPanel}>
          <div className={styles.logoSection}>
            <img src={logo} alt="Logo" className={styles.mainLogo} />
            <div className={styles.welcomeText}>
              <p>Welcome To</p>
              <h1>KGN ASSOCIATES</h1>
            </div>
          </div>
          <div className={styles.bottomGlow}></div>
        </div>

        {/* Right Side: Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContent}>
            <h2 className={styles.adminTitle}>Admin Signup</h2>
            
            <form className={styles.form} onSubmit={handleSignup}>
              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={22} />
                <input 
                  type="text" 
                  name="username"
                  placeholder="Username" 
                  className={styles.inputField}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={22} />
                <input 
                  type="text" 
                  name="first_name"
                  placeholder="First Name" 
                  className={styles.inputField}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <User className={styles.inputIcon} size={22} />
                <input 
                  type="text" 
                  name="last_name"
                  placeholder="Last Name" 
                  className={styles.inputField}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <Mail className={styles.inputIcon} size={22} />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Email" 
                  className={styles.inputField}
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

              <button type="submit" className={styles.loginButton} disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>

              <div className={styles.loginContainer}>
                <p className={styles.loginText}>
                  Already have an account?{' '}
                  <span className={styles.loginLink} onClick={handleLoginClick}>
                    Login
                  </span>
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

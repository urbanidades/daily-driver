import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

// Password strength checker
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  // Map score to strength
  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#22c55e' };
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { signIn, signUp, signInWithOtp, signInWithOAuth } = useAuth();
  
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const emailValid = useMemo(() => isValidEmail(email), [email]);
  const passwordsMatch = password === confirmPassword;
  
  // Validation for signup form
  const signUpValid = emailValid && 
    passwordStrength.score >= 3 && // Medium or higher
    passwordsMatch && 
    password.length >= 8;

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation for signup
    if (isSignUp) {
      if (!emailValid) {
        setError('Please enter a valid email address.');
        return;
      }
      if (passwordStrength.score < 3) {
        setError('Password is too weak. Use at least 8 characters with uppercase, lowercase, numbers, and symbols.');
        return;
      }
      if (!passwordsMatch) {
        setError('Passwords do not match.');
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await signIn({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!emailValid) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await signInWithOtp({ email });
      if (error) throw error;
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <img src="/logo-light.png" alt="Daily Driver" className="login-logo" />
          <p className="login-subtitle">Your productivity, powered by AI.</p>
        </div>

        {otpSent ? (
          <div className="login-success">
            <span className="material-symbols-outlined">mark_email_read</span>
            <h2>Check your email</h2>
            <p>We've sent a magic link to <strong>{email}</strong>.</p>
            <button className="btn btn-secondary" onClick={() => setOtpSent(false)}>Back to Login</button>
          </div>
        ) : (
          <>
            <form className="login-form" onSubmit={handleEmailAuth}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`input ${email && !emailValid ? 'input-error' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {email && !emailValid && (
                  <span className="field-error">Please enter a valid email</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {isSignUp && password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className="strength-fill"
                        style={{ 
                          width: `${(passwordStrength.score / 6) * 100}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      />
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {isSignUp && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className={`input ${confirmPassword && !passwordsMatch ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && !passwordsMatch && (
                    <span className="field-error">Passwords do not match</span>
                  )}
                </div>
              )}

              {error && <div className="login-error">{error}</div>}

              <button 
                className="btn btn-primary login-submit" 
                disabled={loading || (isSignUp && !signUpValid)}
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <div className="login-divider">
              <span>or</span>
            </div>

            <div className="login-social">
              <button className="btn btn-secondary social-btn" onClick={() => handleOAuth('github')}>
                <img src="https://authjs.dev/img/providers/github.svg" alt="GitHub" />
                GitHub
              </button>
              <button className="btn btn-secondary social-btn" onClick={() => handleOAuth('google')}>
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" />
                Google
              </button>
            </div>

            <p className="login-toggle">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(null); setConfirmPassword(''); }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
            
            {!isSignUp && (
               <button className="login-magic-link" onClick={handleMagicLink} disabled={!email || loading}>
                Email me a Magic Link instead
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LoginPage;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Waves from '../../components/common/Waves';
import Toast from '../../components/common/Toast';
import './RecruiterRegister.css';

export default function RecruiterLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login/recruiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login successful
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('userRole', 'ROLE_RECRUITER');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('organization', JSON.stringify(data.data.organization));
        localStorage.setItem('poc', JSON.stringify(data.data.poc));

        // Show welcome toast
        showToast(`Welcome back, ${data.data.poc.name}! 🎉`, 'success');
        
        // Navigate to recruiter dashboard
        setTimeout(() => {
          navigate('/recruiter/dashboard');
        }, 2000);
      } else {
        // Login failed - check for specific error types
        if (response.status === 403) {
          // Account pending or rejected
          if (data.status === 'PENDING_VERIFICATION') {
            showToast('Your account is pending TPO Admin approval. Please wait for verification.', 'error');
          } else if (data.status === 'REJECTED') {
            showToast(`Your registration was rejected: ${data.rejection_reason || 'Please contact support'}`, 'error');
          } else {
            showToast(data.error || 'Your account is disabled. Please contact support.', 'error');
          }
        } else {
          showToast(data.error || 'Login failed. Please check your credentials.', 'error');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Network error. Please check if the backend is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="recruiter-register">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      {/* Waves Background */}
      <Waves
        lineColor="rgba(168, 85, 247, 0.3)"
        backgroundColor="transparent"
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={12}
        yGap={36}
      />
      
      {/* Content */}
      <div className="register-content">
        <div className="form-container" style={{ maxWidth: '500px', margin: '4rem auto' }}>
          {/* Back to Home Link */}
          <Link to="/" className="back-link">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="form-header" style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
            }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '2rem', height: '2rem', color: '#ffffff' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#ffffff', marginBottom: '0.5rem', textAlign: 'center' }}>
              Recruiter Login
            </h1>
            <p style={{ color: '#c084fc', textAlign: 'center', fontSize: '1rem' }}>
              Welcome back! Please login to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                >
                  {showPassword ? (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '1rem 2rem',
                background: isLoading ? 'rgba(168, 85, 247, 0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '0.75rem',
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)',
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </>
              )}
            </button>

            {/* Register Link */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ color: '#9333ea', marginBottom: '0.5rem' }}>Don't have an account?</p>
              <Link 
                to="/register?role=recruiter" 
                style={{
                  color: '#c084fc',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'color 0.3s ease',
                }}
              >
                Register here →
              </Link>
            </div>

            {/* Check Status Link */}
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <Link 
                to="/recruiter/status" 
                style={{
                  color: '#9333ea',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  transition: 'color 0.3s ease',
                }}
              >
                Check registration status
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

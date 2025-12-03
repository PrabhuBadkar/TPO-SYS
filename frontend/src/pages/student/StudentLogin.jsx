import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DotGrid from '../../components/common/DotGrid';
import Toast from '../../components/common/Toast';
import './StudentAuth.css';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    urn: '',
    department: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const departments = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others'];

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

    if (!formData.urn.trim()) {
      newErrors.urn = 'URN is required';
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department';
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
      const response = await fetch('http://localhost:5000/api/auth/login/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urn: formData.urn,
          department: formData.department,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login successful
        // Store tokens in localStorage
        localStorage.setItem('accessToken', data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        localStorage.setItem('userRole', 'ROLE_STUDENT');
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('profile', JSON.stringify(data.data.profile));

        // Show beautiful welcome toast
        showToast(`Welcome back, ${data.data.profile.firstName}! 🎉`, 'success');
        
        // Navigate to student dashboard
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 2000);
      } else {
        // Login failed
        showToast(data.message || 'Login failed. Please check your credentials.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Network error. Please check if the backend is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      {/* DotGrid Background */}
      <DotGrid
        dotSize={6}
        gap={25}
        baseColor="rgba(59, 130, 246, 0.4)"
        activeColor="rgba(59, 130, 246, 0.9)"
        proximity={140}
        className="auth-background"
      />
      
      {/* Content */}
      <div className="auth-content">
        <div className="auth-container">
          {/* Header */}
          <div className="auth-header">
            <Link to="/" className="back-link">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
            <h1 className="auth-title">Student Login</h1>
            <p className="auth-subtitle">Welcome back! Please login to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* URN Field */}
            <div className="form-group">
              <label htmlFor="urn" className="form-label">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                University Registration Number (URN)
              </label>
              <input
                type="text"
                id="urn"
                name="urn"
                value={formData.urn}
                onChange={handleChange}
                className={`form-input ${errors.urn ? 'error' : ''}`}
                placeholder="Enter your URN"
              />
              {errors.urn && <span className="error-message">{errors.urn}</span>}
            </div>

            {/* Department Field */}
            <div className="form-group">
              <label htmlFor="department" className="form-label">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Department
              </label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`form-input ${errors.department ? 'error' : ''}`}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <span className="error-message">{errors.department}</span>}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="submit-button"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="auth-footer">
              <p>Don't have an account?</p>
              <Link to="/register?role=student" className="auth-link">
                Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

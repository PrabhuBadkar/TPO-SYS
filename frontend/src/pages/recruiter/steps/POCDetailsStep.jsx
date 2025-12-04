import { useState } from 'react';
import '../../../components/profile/StepForm.css';

export default function POCDetailsStep({ data, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    poc_name: data.poc_name || '',
    designation: data.designation || '',
    department: data.department || '',
    email: data.email || '',
    mobile_number: data.mobile_number || '',
    linkedin_profile: data.linkedin_profile || '',
    password: data.password || '',
    confirm_password: data.confirm_password || '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const departments = [
    'HR',
    'Campus Relations',
    'Hiring Manager',
    'Talent Acquisition',
    'Recruitment',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // POC Name
    if (!formData.poc_name.trim()) {
      newErrors.poc_name = 'Full name is required';
    } else if (formData.poc_name.trim().length < 2) {
      newErrors.poc_name = 'Name must be at least 2 characters';
    }

    // Designation
    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required';
    } else if (formData.designation.trim().length < 2) {
      newErrors.designation = 'Designation must be at least 2 characters';
    }

    // Department
    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (data.website) {
      // Extract domain from company website
      const websiteDomain = data.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      const emailDomain = formData.email.split('@')[1];
      
      // Check if email domain matches company domain
      if (!emailDomain.includes(websiteDomain.split('.')[0])) {
        newErrors.email = `Email should be from company domain (${websiteDomain})`;
      }
    }

    // Mobile Number
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Please enter a valid 10-digit mobile number';
    }

    // LinkedIn Profile (optional but validate if provided)
    if (formData.linkedin_profile && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(formData.linkedin_profile)) {
      newErrors.linkedin_profile = 'Please enter a valid LinkedIn URL';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm Password
    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="step-form">
      <div className="form-section">
        <h2 className="section-title">Point of Contact (POC) Details</h2>
        <p className="section-description">
          Primary contact person for recruitment activities
        </p>

        <div className="form-grid">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="poc_name" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="poc_name"
              name="poc_name"
              value={formData.poc_name}
              onChange={handleChange}
              className={`form-input ${errors.poc_name ? 'error' : ''}`}
              placeholder="Enter full name"
            />
            {errors.poc_name && <span className="error-message">{errors.poc_name}</span>}
          </div>

          {/* Designation */}
          <div className="form-group">
            <label htmlFor="designation" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Designation <span className="required">*</span>
            </label>
            <input
              type="text"
              id="designation"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className={`form-input ${errors.designation ? 'error' : ''}`}
              placeholder="e.g., HR Manager, Recruitment Lead"
            />
            {errors.designation && <span className="error-message">{errors.designation}</span>}
          </div>

          {/* Department */}
          <div className="form-group">
            <label htmlFor="department" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Department <span className="required">*</span>
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

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="your.email@company.com"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
            {data.website && (
              <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
                Email should be from company domain
              </span>
            )}
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label htmlFor="mobile_number" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Mobile Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="mobile_number"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={handleChange}
              className={`form-input ${errors.mobile_number ? 'error' : ''}`}
              placeholder="10-digit mobile number"
              maxLength="10"
            />
            {errors.mobile_number && <span className="error-message">{errors.mobile_number}</span>}
          </div>

          {/* LinkedIn Profile */}
          <div className="form-group">
            <label htmlFor="linkedin_profile" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              LinkedIn Profile (Optional)
            </label>
            <input
              type="url"
              id="linkedin_profile"
              name="linkedin_profile"
              value={formData.linkedin_profile}
              onChange={handleChange}
              className={`form-input ${errors.linkedin_profile ? 'error' : ''}`}
              placeholder="https://linkedin.com/in/yourprofile"
            />
            {errors.linkedin_profile && <span className="error-message">{errors.linkedin_profile}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
              Min 8 characters, include uppercase, lowercase, and number
            </span>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirm_password" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Confirm Password <span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className={`form-input ${errors.confirm_password ? 'error' : ''}`}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#c084fc',
                  cursor: 'pointer',
                }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.confirm_password && <span className="error-message">{errors.confirm_password}</span>}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          Next
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}

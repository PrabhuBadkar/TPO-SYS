import { useState } from 'react';
import './StepForm.css';

export default function PreferencesConsentStep({ data, onSubmit, onBack, loading }) {
  const [formData, setFormData] = useState({
    preferred_job_roles: data.preferred_job_roles || [],
    preferred_employment_type: data.preferred_employment_type || '',
    preferred_locations: data.preferred_locations || [],
    expected_ctc_min: data.expected_ctc_min || '',
    expected_ctc_max: data.expected_ctc_max || '',
    data_sharing_consent: data.data_sharing_consent || false,
  });

  const [errors, setErrors] = useState({});
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Job Roles Management
  const addJobRole = () => {
    if (newRole.trim() && !formData.preferred_job_roles.includes(newRole.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_job_roles: [...prev.preferred_job_roles, newRole.trim()]
      }));
      setNewRole('');
    }
  };

  const removeJobRole = (role) => {
    setFormData(prev => ({
      ...prev,
      preferred_job_roles: prev.preferred_job_roles.filter(r => r !== role)
    }));
  };

  // Locations Management
  const addLocation = () => {
    if (newLocation.trim() && !formData.preferred_locations.includes(newLocation.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_locations: [...prev.preferred_locations, newLocation.trim()]
      }));
      setNewLocation('');
    }
  };

  const removeLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      preferred_locations: prev.preferred_locations.filter(l => l !== location)
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Job Roles
    if (formData.preferred_job_roles.length === 0) {
      newErrors.preferred_job_roles = 'Please add at least one preferred job role';
    }

    // Employment Type
    if (!formData.preferred_employment_type) {
      newErrors.preferred_employment_type = 'Please select employment type';
    }

    // Locations
    if (formData.preferred_locations.length === 0) {
      newErrors.preferred_locations = 'Please add at least one preferred location';
    }

    // CTC Range
    if (!formData.expected_ctc_min) {
      newErrors.expected_ctc_min = 'Minimum CTC is required';
    } else if (formData.expected_ctc_min < 0) {
      newErrors.expected_ctc_min = 'CTC cannot be negative';
    }

    if (!formData.expected_ctc_max) {
      newErrors.expected_ctc_max = 'Maximum CTC is required';
    } else if (formData.expected_ctc_max < 0) {
      newErrors.expected_ctc_max = 'CTC cannot be negative';
    }

    if (formData.expected_ctc_min && formData.expected_ctc_max) {
      if (parseInt(formData.expected_ctc_max) < parseInt(formData.expected_ctc_min)) {
        newErrors.expected_ctc_max = 'Maximum CTC must be greater than minimum';
      }
    }

    // Data Sharing Consent
    if (!formData.data_sharing_consent) {
      newErrors.data_sharing_consent = 'You must agree to share your data with recruiters';
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

  const popularRoles = [
    'Software Developer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Mobile App Developer',
    'UI/UX Designer',
    'Product Manager',
  ];

  const popularLocations = [
    'Bangalore',
    'Pune',
    'Hyderabad',
    'Mumbai',
    'Delhi NCR',
    'Chennai',
    'Kolkata',
    'Remote',
    'Anywhere in India',
  ];

  return (
    <form onSubmit={handleSubmit} className="step-form">
      {/* Job Roles Section */}
      <div className="form-section">
        <h2 className="section-title">Preferred Job Roles</h2>
        <p className="section-description">
          Select or add the job roles you're interested in
        </p>

        {/* Selected Roles */}
        {formData.preferred_job_roles.length > 0 && (
          <div className="tags-container">
            {formData.preferred_job_roles.map((role, index) => (
              <div key={index} className="tag">
                <span>{role}</span>
                <button
                  type="button"
                  onClick={() => removeJobRole(role)}
                  className="tag-remove"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Role */}
        <div className="add-item-container">
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addJobRole())}
            className="form-input"
            placeholder="Type a job role and press Enter"
          />
          <button type="button" onClick={addJobRole} className="add-item-btn">
            Add
          </button>
        </div>

        {/* Popular Roles */}
        <div className="suggestions">
          <p className="suggestions-label">Popular roles:</p>
          <div className="suggestions-list">
            {popularRoles.filter(role => !formData.preferred_job_roles.includes(role)).map((role, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  preferred_job_roles: [...prev.preferred_job_roles, role]
                }))}
                className="suggestion-btn"
              >
                + {role}
              </button>
            ))}
          </div>
        </div>

        {errors.preferred_job_roles && <span className="error-message">{errors.preferred_job_roles}</span>}
      </div>

      {/* Employment Type */}
      <div className="form-section">
        <h2 className="section-title">Employment Type</h2>
        
        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="preferred_employment_type" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Preferred Employment Type <span className="required">*</span>
            </label>
            <select
              id="preferred_employment_type"
              name="preferred_employment_type"
              value={formData.preferred_employment_type}
              onChange={handleChange}
              className={`form-input ${errors.preferred_employment_type ? 'error' : ''}`}
            >
              <option value="">Select Employment Type</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Both">Both (Full-time & Internship)</option>
            </select>
            {errors.preferred_employment_type && <span className="error-message">{errors.preferred_employment_type}</span>}
          </div>
        </div>
      </div>

      {/* Preferred Locations */}
      <div className="form-section">
        <h2 className="section-title">Preferred Locations</h2>
        <p className="section-description">
          Where would you like to work?
        </p>

        {/* Selected Locations */}
        {formData.preferred_locations.length > 0 && (
          <div className="tags-container">
            {formData.preferred_locations.map((location, index) => (
              <div key={index} className="tag">
                <span>{location}</span>
                <button
                  type="button"
                  onClick={() => removeLocation(location)}
                  className="tag-remove"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Location */}
        <div className="add-item-container">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
            className="form-input"
            placeholder="Type a location and press Enter"
          />
          <button type="button" onClick={addLocation} className="add-item-btn">
            Add
          </button>
        </div>

        {/* Popular Locations */}
        <div className="suggestions">
          <p className="suggestions-label">Popular locations:</p>
          <div className="suggestions-list">
            {popularLocations.filter(loc => !formData.preferred_locations.includes(loc)).map((location, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  preferred_locations: [...prev.preferred_locations, location]
                }))}
                className="suggestion-btn"
              >
                + {location}
              </button>
            ))}
          </div>
        </div>

        {errors.preferred_locations && <span className="error-message">{errors.preferred_locations}</span>}
      </div>

      {/* Expected CTC Range */}
      <div className="form-section">
        <h2 className="section-title">Expected CTC Range</h2>
        <p className="section-description">
          Specify your expected salary range (in LPA - Lakhs Per Annum)
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="expected_ctc_min" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Minimum CTC (LPA) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="expected_ctc_min"
              name="expected_ctc_min"
              value={formData.expected_ctc_min}
              onChange={handleChange}
              className={`form-input ${errors.expected_ctc_min ? 'error' : ''}`}
              placeholder="e.g., 6"
              min="0"
              step="0.5"
            />
            {errors.expected_ctc_min && <span className="error-message">{errors.expected_ctc_min}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expected_ctc_max" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Maximum CTC (LPA) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="expected_ctc_max"
              name="expected_ctc_max"
              value={formData.expected_ctc_max}
              onChange={handleChange}
              className={`form-input ${errors.expected_ctc_max ? 'error' : ''}`}
              placeholder="e.g., 10"
              min="0"
              step="0.5"
            />
            {errors.expected_ctc_max && <span className="error-message">{errors.expected_ctc_max}</span>}
          </div>
        </div>
      </div>

      {/* Data Sharing Consent */}
      <div className="form-section">
        <h2 className="section-title">Data Sharing Consent</h2>
        
        <div className="consent-box">
          <label className="consent-label">
            <input
              type="checkbox"
              name="data_sharing_consent"
              checked={formData.data_sharing_consent}
              onChange={handleChange}
              className="consent-checkbox"
            />
            <div className="consent-text">
              <p className="consent-title">
                I consent to share my profile data with recruiters
              </p>
              <p className="consent-description">
                By checking this box, you agree to share your profile information with potential employers and recruiters through the TPO system. This includes your academic records, skills, projects, and contact information. You can revoke this consent at any time from your profile settings.
              </p>
            </div>
          </label>
          {errors.data_sharing_consent && <span className="error-message">{errors.data_sharing_consent}</span>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          disabled={loading}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              Submit Profile
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

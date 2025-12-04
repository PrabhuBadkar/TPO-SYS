import { useState } from 'react';
import '../../../components/profile/StepForm.css';

export default function CompanyInfoStep({ data, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    org_name: data.org_name || '',
    website: data.website || '',
    industry: data.industry || '',
    size: data.size || '',
    headquarters: data.headquarters || '',
    branch_offices: data.branch_offices || [],
    year_established: data.year_established || '',
    description: data.description || '',
  });

  const [errors, setErrors] = useState({});
  const [newBranch, setNewBranch] = useState('');

  const industries = [
    'Information Technology',
    'Finance & Banking',
    'Healthcare',
    'Manufacturing',
    'Retail & E-commerce',
    'Consulting',
    'Education',
    'Telecommunications',
    'Automotive',
    'Pharmaceuticals',
    'Real Estate',
    'Media & Entertainment',
    'Energy & Utilities',
    'Transportation & Logistics',
    'Other',
  ];

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addBranch = () => {
    if (newBranch.trim() && !formData.branch_offices.includes(newBranch.trim())) {
      setFormData(prev => ({
        ...prev,
        branch_offices: [...prev.branch_offices, newBranch.trim()]
      }));
      setNewBranch('');
    }
  };

  const removeBranch = (branch) => {
    setFormData(prev => ({
      ...prev,
      branch_offices: prev.branch_offices.filter(b => b !== branch)
    }));
  };

  const validate = () => {
    const newErrors = {};

    // Company Name
    if (!formData.org_name.trim()) {
      newErrors.org_name = 'Company name is required';
    } else if (formData.org_name.trim().length < 2) {
      newErrors.org_name = 'Company name must be at least 2 characters';
    }

    // Website
    if (!formData.website.trim()) {
      newErrors.website = 'Website is required';
    } else if (!/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL (e.g., https://example.com)';
    }

    // Industry
    if (!formData.industry) {
      newErrors.industry = 'Please select an industry';
    }

    // Company Size
    if (!formData.size) {
      newErrors.size = 'Please select company size';
    }

    // Headquarters
    if (!formData.headquarters.trim()) {
      newErrors.headquarters = 'Headquarters location is required';
    } else if (formData.headquarters.trim().length < 5) {
      newErrors.headquarters = 'Please enter a complete location';
    }

    // Year Established
    if (!formData.year_established) {
      newErrors.year_established = 'Year established is required';
    } else {
      const year = parseInt(formData.year_established);
      const currentYear = new Date().getFullYear();
      if (year < 1800 || year > currentYear) {
        newErrors.year_established = `Year must be between 1800 and ${currentYear}`;
      }
    }

    // Description
    if (!formData.description.trim()) {
      newErrors.description = 'Company description is required';
    } else if (formData.description.trim().length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
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
        <h2 className="section-title">Company Information</h2>
        <p className="section-description">
          Tell us about your organization
        </p>

        <div className="form-grid">
          {/* Company Name */}
          <div className="form-group full-width">
            <label htmlFor="org_name" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="org_name"
              name="org_name"
              value={formData.org_name}
              onChange={handleChange}
              className={`form-input ${errors.org_name ? 'error' : ''}`}
              placeholder="Enter company name"
            />
            {errors.org_name && <span className="error-message">{errors.org_name}</span>}
          </div>

          {/* Website */}
          <div className="form-group">
            <label htmlFor="website" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Website <span className="required">*</span>
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className={`form-input ${errors.website ? 'error' : ''}`}
              placeholder="https://example.com"
            />
            {errors.website && <span className="error-message">{errors.website}</span>}
          </div>

          {/* Industry */}
          <div className="form-group">
            <label htmlFor="industry" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Industry <span className="required">*</span>
            </label>
            <select
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className={`form-input ${errors.industry ? 'error' : ''}`}
            >
              <option value="">Select Industry</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
            {errors.industry && <span className="error-message">{errors.industry}</span>}
          </div>

          {/* Company Size */}
          <div className="form-group">
            <label htmlFor="size" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Company Size <span className="required">*</span>
            </label>
            <select
              id="size"
              name="size"
              value={formData.size}
              onChange={handleChange}
              className={`form-input ${errors.size ? 'error' : ''}`}
            >
              <option value="">Select Size</option>
              {companySizes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.size && <span className="error-message">{errors.size}</span>}
          </div>

          {/* Headquarters */}
          <div className="form-group">
            <label htmlFor="headquarters" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Headquarters Location <span className="required">*</span>
            </label>
            <input
              type="text"
              id="headquarters"
              name="headquarters"
              value={formData.headquarters}
              onChange={handleChange}
              className={`form-input ${errors.headquarters ? 'error' : ''}`}
              placeholder="City, State, Country"
            />
            {errors.headquarters && <span className="error-message">{errors.headquarters}</span>}
          </div>

          {/* Year Established */}
          <div className="form-group">
            <label htmlFor="year_established" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Year Established <span className="required">*</span>
            </label>
            <input
              type="number"
              id="year_established"
              name="year_established"
              value={formData.year_established}
              onChange={handleChange}
              className={`form-input ${errors.year_established ? 'error' : ''}`}
              placeholder="e.g., 2010"
              min="1800"
              max={new Date().getFullYear()}
            />
            {errors.year_established && <span className="error-message">{errors.year_established}</span>}
          </div>

          {/* Branch Offices */}
          <div className="form-group full-width">
            <label className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Branch Offices (Optional)
            </label>
            
            {formData.branch_offices.length > 0 && (
              <div className="tags-container">
                {formData.branch_offices.map((branch, index) => (
                  <div key={index} className="tag">
                    <span>{branch}</span>
                    <button
                      type="button"
                      onClick={() => removeBranch(branch)}
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

            <div className="add-item-container">
              <input
                type="text"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBranch())}
                className="form-input"
                placeholder="Add branch office location"
              />
              <button type="button" onClick={addBranch} className="add-item-btn">
                Add
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="form-group full-width">
            <label htmlFor="description" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Company Description <span className="required">*</span>
              <span style={{ fontSize: '0.75rem', color: '#9333ea', marginLeft: '0.5rem' }}>
                ({formData.description.length}/500 characters, min 50)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`form-input ${errors.description ? 'error' : ''}`}
              placeholder="Describe your company, its mission, and what makes it unique..."
              rows="4"
              maxLength="500"
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          disabled
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

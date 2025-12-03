import { useState } from 'react';
import './StepForm.css';

export default function PersonalInfoStep({ data, onSubmit, onBack, loading }) {
  const [formData, setFormData] = useState({
    mother_name: data.mother_name || '',
    date_of_birth: data.date_of_birth || '',
    gender: data.gender || '',
    category: data.category || '',
    alternate_mobile: data.alternate_mobile || '',
    address_permanent: data.address_permanent || '',
    address_current: data.address_current || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Mother's Name
    if (!formData.mother_name.trim()) {
      newErrors.mother_name = "Mother's name is required";
    } else if (formData.mother_name.trim().length < 2) {
      newErrors.mother_name = "Mother's name must be at least 2 characters";
    }

    // Date of Birth
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18) {
        newErrors.date_of_birth = 'You must be at least 18 years old';
      }
      if (age > 100) {
        newErrors.date_of_birth = 'Please enter a valid date of birth';
      }
    }

    // Gender
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    // Category
    if (!formData.category) {
      newErrors.category = 'Please select your category';
    }

    // Alternate Mobile (optional but validate if provided)
    if (formData.alternate_mobile && !/^[0-9]{10}$/.test(formData.alternate_mobile)) {
      newErrors.alternate_mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Permanent Address
    if (!formData.address_permanent.trim()) {
      newErrors.address_permanent = 'Permanent address is required';
    } else if (formData.address_permanent.trim().length < 10) {
      newErrors.address_permanent = 'Please enter a complete address (min 10 characters)';
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
        <h2 className="section-title">Personal Information</h2>
        <p className="section-description">
          Please provide your personal details accurately
        </p>

        <div className="form-grid">
          {/* Mother's Name */}
          <div className="form-group full-width">
            <label htmlFor="mother_name" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mother's Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="mother_name"
              name="mother_name"
              value={formData.mother_name}
              onChange={handleChange}
              className={`form-input ${errors.mother_name ? 'error' : ''}`}
              placeholder="Enter mother's full name"
            />
            {errors.mother_name && <span className="error-message">{errors.mother_name}</span>}
          </div>

          {/* Date of Birth */}
          <div className="form-group">
            <label htmlFor="date_of_birth" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Date of Birth <span className="required">*</span>
            </label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className={`form-input ${errors.date_of_birth ? 'error' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.date_of_birth && <span className="error-message">{errors.date_of_birth}</span>}
          </div>

          {/* Gender */}
          <div className="form-group">
            <label htmlFor="gender" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Gender <span className="required">*</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`form-input ${errors.gender ? 'error' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <span className="error-message">{errors.gender}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-input ${errors.category ? 'error' : ''}`}
            >
              <option value="">Select Category</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>

          {/* Alternate Mobile */}
          <div className="form-group">
            <label htmlFor="alternate_mobile" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Alternate Mobile Number
            </label>
            <input
              type="tel"
              id="alternate_mobile"
              name="alternate_mobile"
              value={formData.alternate_mobile}
              onChange={handleChange}
              className={`form-input ${errors.alternate_mobile ? 'error' : ''}`}
              placeholder="10-digit mobile number"
              maxLength="10"
            />
            {errors.alternate_mobile && <span className="error-message">{errors.alternate_mobile}</span>}
          </div>

          {/* Permanent Address */}
          <div className="form-group full-width">
            <label htmlFor="address_permanent" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Permanent Address <span className="required">*</span>
            </label>
            <textarea
              id="address_permanent"
              name="address_permanent"
              value={formData.address_permanent}
              onChange={handleChange}
              className={`form-input ${errors.address_permanent ? 'error' : ''}`}
              placeholder="Enter your permanent address"
              rows="3"
            />
            {errors.address_permanent && <span className="error-message">{errors.address_permanent}</span>}
          </div>

          {/* Current Address */}
          <div className="form-group full-width">
            <label htmlFor="address_current" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Current Address (if different)
            </label>
            <textarea
              id="address_current"
              name="address_current"
              value={formData.address_current}
              onChange={handleChange}
              className="form-input"
              placeholder="Leave blank if same as permanent address"
              rows="3"
            />
          </div>
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
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

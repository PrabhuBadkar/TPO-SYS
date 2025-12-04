import { useState } from 'react';
import '../../../components/profile/StepForm.css';

export default function LegalVerificationStep({ data, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    gst_number: data.gst_number || '',
    cin: data.cin || '',
    pan: data.pan || '',
    registration_cert_url: data.registration_cert_url || '',
    authorization_letter_url: data.authorization_letter_url || '',
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState({
    registration_cert: false,
    authorization_letter: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert to uppercase for GST, CIN, PAN
    const upperValue = ['gst_number', 'cin', 'pan'].includes(name) ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: upperValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    setUploading(prev => ({ ...prev, [documentType]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('documentType', documentType);

      const response = await fetch('http://localhost:5000/api/public/upload/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormData(prev => ({
          ...prev,
          [`${documentType}_url`]: result.data.url,
        }));
        alert('File uploaded successfully!');
      } else {
        alert(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // GST Number validation
    if (!formData.gst_number.trim()) {
      newErrors.gst_number = 'GST number is required';
    } else if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(formData.gst_number)) {
      newErrors.gst_number = 'Invalid GST format (e.g., 22AAAAA0000A1Z5)';
    }

    // CIN validation
    if (!formData.cin.trim()) {
      newErrors.cin = 'CIN is required';
    } else if (!/^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(formData.cin)) {
      newErrors.cin = 'Invalid CIN format (e.g., U12345AB2020PTC123456)';
    }

    // PAN validation
    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required';
    } else if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format (e.g., ABCDE1234F)';
    }

    // Registration Certificate
    if (!formData.registration_cert_url) {
      newErrors.registration_cert_url = 'Company registration certificate is required';
    }

    // Authorization Letter
    if (!formData.authorization_letter_url) {
      newErrors.authorization_letter_url = 'Authorization letter is required';
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
        <h2 className="section-title">Legal Verification</h2>
        <p className="section-description">
          Provide your company's legal documents for verification
        </p>

        <div className="form-grid">
          {/* GST Number */}
          <div className="form-group">
            <label htmlFor="gst_number" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              GST Number <span className="required">*</span>
            </label>
            <input
              type="text"
              id="gst_number"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              className={`form-input ${errors.gst_number ? 'error' : ''}`}
              placeholder="22AAAAA0000A1Z5"
              maxLength="15"
            />
            {errors.gst_number && <span className="error-message">{errors.gst_number}</span>}
            <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
              Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
            </span>
          </div>

          {/* CIN */}
          <div className="form-group">
            <label htmlFor="cin" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              CIN (Corporate Identification Number) <span className="required">*</span>
            </label>
            <input
              type="text"
              id="cin"
              name="cin"
              value={formData.cin}
              onChange={handleChange}
              className={`form-input ${errors.cin ? 'error' : ''}`}
              placeholder="U12345AB2020PTC123456"
              maxLength="21"
            />
            {errors.cin && <span className="error-message">{errors.cin}</span>}
            <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
              Format: U/L + 5 digits + 2 letters + 4 digits + 3 letters + 6 digits
            </span>
          </div>

          {/* PAN */}
          <div className="form-group">
            <label htmlFor="pan" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              PAN (Permanent Account Number) <span className="required">*</span>
            </label>
            <input
              type="text"
              id="pan"
              name="pan"
              value={formData.pan}
              onChange={handleChange}
              className={`form-input ${errors.pan ? 'error' : ''}`}
              placeholder="ABCDE1234F"
              maxLength="10"
            />
            {errors.pan && <span className="error-message">{errors.pan}</span>}
            <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
              Format: 5 letters + 4 digits + 1 letter
            </span>
          </div>

          {/* Registration Certificate Upload */}
          <div className="form-group full-width">
            <label className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Company Registration Certificate <span className="required">*</span>
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                id="registration_cert"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'registration_cert')}
                className="file-input"
                disabled={uploading.registration_cert}
              />
              <label htmlFor="registration_cert" className="file-upload-label">
                {uploading.registration_cert ? (
                  <>
                    <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : formData.registration_cert_url ? (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    File Uploaded
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose PDF File (Max 5MB)
                  </>
                )}
              </label>
              {formData.registration_cert_url && (
                <a
                  href={`http://localhost:5000${formData.registration_cert_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-view-link"
                >
                  View Uploaded File
                </a>
              )}
            </div>
            {errors.registration_cert_url && <span className="error-message">{errors.registration_cert_url}</span>}
          </div>

          {/* Authorization Letter Upload */}
          <div className="form-group full-width">
            <label className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Authorization Letter <span className="required">*</span>
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                id="authorization_letter"
                accept=".pdf"
                onChange={(e) => handleFileUpload(e, 'authorization_letter')}
                className="file-input"
                disabled={uploading.authorization_letter}
              />
              <label htmlFor="authorization_letter" className="file-upload-label">
                {uploading.authorization_letter ? (
                  <>
                    <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : formData.authorization_letter_url ? (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    File Uploaded
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose PDF File (Max 5MB)
                  </>
                )}
              </label>
              {formData.authorization_letter_url && (
                <a
                  href={`http://localhost:5000${formData.authorization_letter_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-view-link"
                >
                  View Uploaded File
                </a>
              )}
            </div>
            {errors.authorization_letter_url && <span className="error-message">{errors.authorization_letter_url}</span>}
            <span style={{ fontSize: '0.75rem', color: '#9333ea' }}>
              Authorization letter on company letterhead, signed by authorized signatory
            </span>
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

import { useState } from 'react';
import '../../../components/profile/StepForm.css';

export default function ReviewSubmitStep({ data, onSubmit, onBack, loading }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      setError('You must accept the terms and conditions to proceed');
      return;
    }

    setError('');
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="step-form">
      <div className="form-section">
        <h2 className="section-title">Review & Submit</h2>
        <p className="section-description">
          Please review your information before submitting
        </p>

        {/* Company Information */}
        <div className="review-section">
          <h3 className="review-section-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Company Information
          </h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Company Name:</span>
              <span className="review-value">{data.org_name}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Website:</span>
              <span className="review-value">{data.website}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Industry:</span>
              <span className="review-value">{data.industry}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Company Size:</span>
              <span className="review-value">{data.size}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Headquarters:</span>
              <span className="review-value">{data.headquarters}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Year Established:</span>
              <span className="review-value">{data.year_established}</span>
            </div>
            {data.branch_offices && data.branch_offices.length > 0 && (
              <div className="review-item full-width">
                <span className="review-label">Branch Offices:</span>
                <span className="review-value">{data.branch_offices.join(', ')}</span>
              </div>
            )}
            <div className="review-item full-width">
              <span className="review-label">Description:</span>
              <span className="review-value">{data.description}</span>
            </div>
          </div>
        </div>

        {/* Legal Verification */}
        <div className="review-section">
          <h3 className="review-section-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Legal Verification
          </h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">GST Number:</span>
              <span className="review-value">{data.gst_number}</span>
            </div>
            <div className="review-item">
              <span className="review-label">CIN:</span>
              <span className="review-value">{data.cin}</span>
            </div>
            <div className="review-item">
              <span className="review-label">PAN:</span>
              <span className="review-value">{data.pan}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Registration Certificate:</span>
              <span className="review-value">
                {data.registration_cert_url ? (
                  <a 
                    href={`http://localhost:5000${data.registration_cert_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#4ade80', textDecoration: 'underline' }}
                  >
                    View Document
                  </a>
                ) : 'Not uploaded'}
              </span>
            </div>
            <div className="review-item">
              <span className="review-label">Authorization Letter:</span>
              <span className="review-value">
                {data.authorization_letter_url ? (
                  <a 
                    href={`http://localhost:5000${data.authorization_letter_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#4ade80', textDecoration: 'underline' }}
                  >
                    View Document
                  </a>
                ) : 'Not uploaded'}
              </span>
            </div>
          </div>
        </div>

        {/* POC Details */}
        <div className="review-section">
          <h3 className="review-section-title">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Point of Contact
          </h3>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Full Name:</span>
              <span className="review-value">{data.poc_name}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Designation:</span>
              <span className="review-value">{data.designation}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Department:</span>
              <span className="review-value">{data.department}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Email:</span>
              <span className="review-value">{data.email}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Mobile Number:</span>
              <span className="review-value">{data.mobile_number}</span>
            </div>
            {data.linkedin_profile && (
              <div className="review-item">
                <span className="review-label">LinkedIn:</span>
                <span className="review-value">
                  <a 
                    href={data.linkedin_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#4ade80', textDecoration: 'underline' }}
                  >
                    View Profile
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="consent-box" style={{ marginTop: '2rem' }}>
          <label className="consent-label">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (e.target.checked) setError('');
              }}
              className="consent-checkbox"
            />
            <div className="consent-text">
              <p className="consent-title">
                I accept the Terms and Conditions
              </p>
              <p className="consent-description">
                By submitting this registration, I confirm that:
                <br />• All information provided is accurate and truthful
                <br />• I am authorized to represent this organization
                <br />• I agree to comply with the platform's policies and guidelines
                <br />• I understand that my account will be reviewed by TPO Admin before activation
                <br />• I consent to receive communications regarding my registration status
              </p>
            </div>
          </label>
          {error && <span className="error-message" style={{ marginTop: '1rem' }}>{error}</span>}
        </div>

        {/* Important Notice */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem 1.5rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.75rem',
          color: '#93c5fd',
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.5rem', height: '1.5rem', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Important Notice</p>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                Your registration will be reviewed by our TPO Admin team. You will receive an email notification once your account is approved. 
                You will not be able to login until your account is verified and activated.
              </p>
            </div>
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
              Submitting...
            </>
          ) : (
            <>
              Submit Registration
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

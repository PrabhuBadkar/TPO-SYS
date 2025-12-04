import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Waves from '../../components/common/Waves';
import CompanyInfoStep from './steps/CompanyInfoStep.jsx';
import LegalVerificationStep from './steps/LegalVerificationStep.jsx';
import POCDetailsStep from './steps/POCDetailsStep.jsx';
import ReviewSubmitStep from './steps/ReviewSubmitStep.jsx';
import './RecruiterRegister.css';

export default function RecruiterRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Company Info
    org_name: '',
    website: '',
    industry: '',
    size: '',
    headquarters: '',
    branch_offices: [],
    year_established: '',
    description: '',
    
    // Step 2: Legal Verification
    gst_number: '',
    cin: '',
    pan: '',
    registration_cert_url: '',
    authorization_letter_url: '',
    
    // Step 3: POC Details
    poc_name: '',
    designation: '',
    department: '',
    email: '',
    mobile_number: '',
    linkedin_profile: '',
    
    // Password
    password: '',
    confirm_password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStepSubmit = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    setError(null);
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleFinalSubmit = async (finalData) => {
    setLoading(true);
    setError(null);

    try {
      const submitData = { ...formData, ...finalData };
      
      console.log('Submitting registration data:', submitData);
      
      const response = await fetch('http://localhost:5000/api/auth/register/recruiter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      console.log('Registration response:', data);

      if (response.ok && data.success) {
        // Registration successful
        localStorage.setItem('recruiter_email', submitData.email);
        navigate('/recruiter/status');
      } else {
        // Show detailed error
        const errorMessage = data.details 
          ? `Validation error: ${JSON.stringify(data.details)}`
          : data.error || 'Failed to register';
        setError(errorMessage);
        console.error('Registration failed:', data);
        alert(errorMessage); // Temporary alert to see the error
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
      alert('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Company Information', icon: 'building' },
    { number: 2, title: 'Legal Verification', icon: 'document' },
    { number: 3, title: 'POC Details', icon: 'user' },
    { number: 4, title: 'Review & Submit', icon: 'check' },
  ];

  return (
    <div className="recruiter-register">
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
        {/* Header */}
        <div className="register-header">
          <h1 className="register-title">Recruiter Registration</h1>
          <p className="register-subtitle">
            Join our placement platform to connect with talented students
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`progress-step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            >
              <div className="step-circle">
                {currentStep > step.number ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="step-info">
                <span className="step-title">{step.title}</span>
                <span className="step-subtitle">Step {step.number} of 4</span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>

        {/* Form Container */}
        <div className="form-container">
          {/* Error Message */}
          {error && (
            <div className="error-box">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && (
            <CompanyInfoStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 2 && (
            <LegalVerificationStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 3 && (
            <POCDetailsStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 4 && (
            <ReviewSubmitStep
              data={formData}
              onSubmit={handleFinalSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

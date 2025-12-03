import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from '../../components/common/Galaxy';
import PersonalInfoStep from '../../components/profile/PersonalInfoStep';
import AcademicDetailsStep from '../../components/profile/AcademicDetailsStep';
import SkillsExperienceStep from '../../components/profile/SkillsExperienceStep';
import PreferencesConsentStep from '../../components/profile/PreferencesConsentStep';
import './ProfileCompletion.css';

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    mother_name: '',
    date_of_birth: '',
    gender: '',
    category: '',
    alternate_mobile: '',
    address_permanent: '',
    address_current: '',
    
    // Step 2: Academic Details
    degree: '',
    roll_number: '',
    year_of_admission: '',
    current_semester: '',
    expected_graduation_year: '',
    cgpi: '',
    active_backlogs: false,
    is_direct_second_year: false,
    ssc_year_of_passing: '',
    ssc_board: '',
    ssc_percentage: '',
    hsc_year_of_passing: '',
    hsc_board: '',
    hsc_percentage: '',
    diploma_year_of_passing: '',
    diploma_percentage: '',
    
    // Step 3: Skills & Experience
    skills: { skills: [] },
    projects: [],
    certifications: [],
    internships: [],
    competitive_profiles: {},
    
    // Step 4: Job Preferences
    preferred_job_roles: [],
    preferred_employment_type: '',
    preferred_locations: [],
    expected_ctc_min: '',
    expected_ctc_max: '',
    data_sharing_consent: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Load existing profile data
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const profile = JSON.parse(localStorage.getItem('profile') || '{}');
      
      // Pre-fill form with existing data
      setFormData(prev => ({
        ...prev,
        ...profile,
        date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleStepSubmit = async (stepData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/public/profile/step${currentStep}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stepData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFormData(prev => ({ ...prev, ...stepData }));
        setSuccess(data.message);
        
        // Update localStorage
        localStorage.setItem('profile', JSON.stringify(data.data));
        
        // Move to next step or finish
        if (currentStep < 4) {
          setTimeout(() => {
            setCurrentStep(currentStep + 1);
            setSuccess(null);
          }, 1000);
        } else {
          // Profile completed
          setTimeout(() => {
            navigate('/student/dashboard');
          }, 2000);
        }
      } else {
        setError(data.error || 'Failed to save data');
      }
    } catch (error) {
      console.error('Step submit error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
      setSuccess(null);
    }
  };

  const steps = [
    { number: 1, title: 'Personal Information', icon: 'user' },
    { number: 2, title: 'Academic Details', icon: 'academic' },
    { number: 3, title: 'Skills & Experience', icon: 'code' },
    { number: 4, title: 'Job Preferences', icon: 'briefcase' },
  ];

  return (
    <div className="profile-completion">
      {/* Galaxy Background */}
      <div className="galaxy-background">
        <Galaxy 
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
          transparent={false}
        />
      </div>

      {/* Content */}
      <div className="completion-content">
        {/* Header */}
        <div className="completion-header">
          <h1 className="completion-title">Complete Your Profile</h1>
          <p className="completion-subtitle">
            Help us know you better to find the perfect opportunities
          </p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`progress-step ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            >
              <div className="step-number">
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
          {/* Success/Error Messages */}
          {success && (
            <div className="message-box success-box">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}
          
          {error && (
            <div className="message-box error-box">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && (
            <PersonalInfoStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
          
          {currentStep === 2 && (
            <AcademicDetailsStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
          
          {currentStep === 3 && (
            <SkillsExperienceStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
          
          {currentStep === 4 && (
            <PreferencesConsentStep
              data={formData}
              onSubmit={handleStepSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

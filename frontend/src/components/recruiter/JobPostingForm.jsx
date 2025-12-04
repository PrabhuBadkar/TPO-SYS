import { useState } from 'react';
import './JobPostingForm.css';

export default function JobPostingForm({ onClose, onSubmit }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Job Details
    job_title: '',
    description: '',
    responsibilities: '',
    required_skills: [],
    qualifications: '',
    work_location: '',
    employment_type: 'Full-Time',
    
    // Step 2: Eligibility Criteria
    eligibility_criteria: {
      degree: [],
      cgpa_min: 6.0,
      max_backlogs: 0,
      graduation_year: new Date().getFullYear(),
      allowed_branches: [],
    },
    
    // Step 3: Compensation Details
    ctc_breakdown: {
      base_salary: '',
      variable_pay: '',
      joining_bonus: '',
      benefits: '',
      total_ctc: '',
    },
    
    // Step 4: Selection Process
    selection_process: {
      rounds: [],
      timeline: '',
      mode: 'Online',
    },
    
    // Step 5: Bond Terms & Application Deadline
    bond_terms: {
      duration_months: 0,
      amount: 0,
      terms: '',
      notice_period_days: 30,
    },
    application_deadline: '',
  });

  const [errors, setErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [roundInput, setRoundInput] = useState('');

  const degrees = ['B.Tech', 'M.Tech', 'MCA', 'MBA', 'Diploma'];
  const branches = ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'Others'];
  const employmentTypes = ['Full-Time', 'Internship', 'Part-Time', 'Contract'];
  const selectionModes = ['Online', 'Offline', 'Hybrid'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayToggle = (field, value) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    setFormData(prev => ({
      ...prev,
      [field]: updated
    }));
  };

  const handleNestedArrayToggle = (parent, field, value) => {
    const current = formData[parent][field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: updated
      }
    }));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }));
  };

  const addRound = () => {
    if (roundInput.trim()) {
      setFormData(prev => ({
        ...prev,
        selection_process: {
          ...prev.selection_process,
          rounds: [...prev.selection_process.rounds, roundInput.trim()]
        }
      }));
      setRoundInput('');
    }
  };

  const removeRound = (index) => {
    setFormData(prev => ({
      ...prev,
      selection_process: {
        ...prev.selection_process,
        rounds: prev.selection_process.rounds.filter((_, i) => i !== index)
      }
    }));
  };

  const calculateTotalCTC = () => {
    const { base_salary, variable_pay, joining_bonus, benefits } = formData.ctc_breakdown;
    const total = (parseFloat(base_salary) || 0) + 
                  (parseFloat(variable_pay) || 0) + 
                  (parseFloat(joining_bonus) || 0) + 
                  (parseFloat(benefits) || 0);
    
    setFormData(prev => ({
      ...prev,
      ctc_breakdown: {
        ...prev.ctc_breakdown,
        total_ctc: total.toFixed(2)
      }
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.job_title.trim()) newErrors.job_title = 'Job title is required';
      if (!formData.description.trim()) newErrors.description = 'Job description is required';
      if (!formData.work_location.trim()) newErrors.work_location = 'Work location is required';
      if (formData.required_skills.length === 0) newErrors.required_skills = 'At least one skill is required';
    }

    if (step === 2) {
      if (formData.eligibility_criteria.degree.length === 0) {
        newErrors.degree = 'At least one degree must be selected';
      }
      if (formData.eligibility_criteria.allowed_branches.length === 0) {
        newErrors.allowed_branches = 'At least one branch must be selected';
      }
      if (formData.eligibility_criteria.cgpa_min < 6.0 || formData.eligibility_criteria.cgpa_min > 10.0) {
        newErrors.cgpa_min = 'CGPA must be between 6.0 and 10.0';
      }
    }

    if (step === 3) {
      if (!formData.ctc_breakdown.base_salary) newErrors.base_salary = 'Base salary is required';
      // Auto-calculate if not done
      if (!formData.ctc_breakdown.total_ctc && formData.ctc_breakdown.base_salary) {
        const total = (parseFloat(formData.ctc_breakdown.base_salary) || 0) + 
                      (parseFloat(formData.ctc_breakdown.variable_pay) || 0) + 
                      (parseFloat(formData.ctc_breakdown.joining_bonus) || 0) + 
                      (parseFloat(formData.ctc_breakdown.benefits) || 0);
        formData.ctc_breakdown.total_ctc = total.toFixed(2);
      }
    }

    if (step === 4) {
      if (formData.selection_process.rounds.length === 0) {
        newErrors.rounds = 'At least one selection round is required';
      }
      if (!formData.selection_process.timeline.trim()) {
        newErrors.timeline = 'Timeline is required';
      }
    }

    if (step === 5) {
      if (!formData.application_deadline) {
        newErrors.application_deadline = 'Application deadline is required';
      }
      if (formData.bond_terms.duration_months > 24) {
        newErrors.bond_duration = 'Bond duration cannot exceed 24 months (2 years)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Auto-calculate CTC before validation on step 3
    if (currentStep === 3) {
      calculateTotalCTC();
    }
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(5)) {
      onSubmit(formData);
    }
  };

  const steps = [
    { number: 1, title: 'Job Details', icon: '📋' },
    { number: 2, title: 'Eligibility', icon: '🎓' },
    { number: 3, title: 'Compensation', icon: '💰' },
    { number: 4, title: 'Selection Process', icon: '📝' },
    { number: 5, title: 'Terms & Deadline', icon: '📅' },
  ];

  return (
    <div className="job-posting-modal-overlay">
      <div className="job-posting-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>Create Job Posting</h2>
          <button className="close-button" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}
            >
              <div className="step-number">{step.icon}</div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Job Details</h3>
              
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="e.g., Software Engineer, Data Analyst"
                  className={errors.job_title ? 'error' : ''}
                />
                {errors.job_title && <span className="error-message">{errors.job_title}</span>}
              </div>

              <div className="form-group">
                <label>Job Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the role, company culture, and what makes this opportunity unique..."
                  rows={5}
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label>Responsibilities</label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleChange}
                  placeholder="List key responsibilities and day-to-day tasks..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Required Skills *</label>
                <div className="skill-input-group">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Type a skill and press Enter"
                  />
                  <button type="button" onClick={addSkill} className="add-button">Add</button>
                </div>
                <div className="skill-tags">
                  {formData.required_skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      <button type="button" onClick={() => removeSkill(index)}>×</button>
                    </span>
                  ))}
                </div>
                {errors.required_skills && <span className="error-message">{errors.required_skills}</span>}
              </div>

              <div className="form-group">
                <label>Qualifications</label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="Educational qualifications, certifications, experience..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Work Location *</label>
                  <input
                    type="text"
                    name="work_location"
                    value={formData.work_location}
                    onChange={handleChange}
                    placeholder="e.g., Bangalore, Remote, Hybrid"
                    className={errors.work_location ? 'error' : ''}
                  />
                  {errors.work_location && <span className="error-message">{errors.work_location}</span>}
                </div>

                <div className="form-group">
                  <label>Employment Type *</label>
                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                  >
                    {employmentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Eligibility Criteria */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Eligibility Criteria</h3>
              
              <div className="form-group">
                <label>Eligible Degrees *</label>
                <div className="checkbox-group">
                  {degrees.map(degree => (
                    <label key={degree} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.eligibility_criteria.degree.includes(degree)}
                        onChange={() => handleNestedArrayToggle('eligibility_criteria', 'degree', degree)}
                      />
                      <span>{degree}</span>
                    </label>
                  ))}
                </div>
                {errors.degree && <span className="error-message">{errors.degree}</span>}
              </div>

              <div className="form-group">
                <label>Allowed Branches/Departments *</label>
                <div className="checkbox-group">
                  {branches.map(branch => (
                    <label key={branch} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.eligibility_criteria.allowed_branches.includes(branch)}
                        onChange={() => handleNestedArrayToggle('eligibility_criteria', 'allowed_branches', branch)}
                      />
                      <span>{branch}</span>
                    </label>
                  ))}
                </div>
                {errors.allowed_branches && <span className="error-message">{errors.allowed_branches}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum CGPA *</label>
                  <input
                    type="number"
                    name="eligibility_criteria.cgpa_min"
                    value={formData.eligibility_criteria.cgpa_min}
                    onChange={handleChange}
                    min="6.0"
                    max="10.0"
                    step="0.1"
                    className={errors.cgpa_min ? 'error' : ''}
                  />
                  {errors.cgpa_min && <span className="error-message">{errors.cgpa_min}</span>}
                </div>

                <div className="form-group">
                  <label>Max Active Backlogs</label>
                  <input
                    type="number"
                    name="eligibility_criteria.max_backlogs"
                    value={formData.eligibility_criteria.max_backlogs}
                    onChange={handleChange}
                    min="0"
                    max="3"
                  />
                </div>

                <div className="form-group">
                  <label>Graduation Year</label>
                  <input
                    type="number"
                    name="eligibility_criteria.graduation_year"
                    value={formData.eligibility_criteria.graduation_year}
                    onChange={handleChange}
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Compensation Details */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Compensation Details</h3>
              <p className="step-description">All amounts in INR (Lakhs per annum)</p>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Base Salary (LPA) *</label>
                  <input
                    type="number"
                    name="ctc_breakdown.base_salary"
                    value={formData.ctc_breakdown.base_salary}
                    onChange={handleChange}
                    placeholder="e.g., 6.0"
                    step="0.1"
                    min="0"
                    className={errors.base_salary ? 'error' : ''}
                  />
                  {errors.base_salary && <span className="error-message">{errors.base_salary}</span>}
                </div>

                <div className="form-group">
                  <label>Variable Pay (LPA)</label>
                  <input
                    type="number"
                    name="ctc_breakdown.variable_pay"
                    value={formData.ctc_breakdown.variable_pay}
                    onChange={handleChange}
                    placeholder="e.g., 1.0"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Joining Bonus (LPA)</label>
                  <input
                    type="number"
                    name="ctc_breakdown.joining_bonus"
                    value={formData.ctc_breakdown.joining_bonus}
                    onChange={handleChange}
                    placeholder="e.g., 0.5"
                    step="0.1"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Benefits (LPA)</label>
                  <input
                    type="number"
                    name="ctc_breakdown.benefits"
                    value={formData.ctc_breakdown.benefits}
                    onChange={handleChange}
                    placeholder="e.g., 0.5"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <button type="button" onClick={calculateTotalCTC} className="calculate-button">
                  Calculate Total CTC
                </button>
              </div>

              <div className="form-group">
                <label>Total CTC (LPA) *</label>
                <input
                  type="number"
                  name="ctc_breakdown.total_ctc"
                  value={formData.ctc_breakdown.total_ctc}
                  readOnly
                  className={`total-ctc ${errors.total_ctc ? 'error' : ''}`}
                  placeholder="Click 'Calculate Total CTC' button"
                />
                {errors.total_ctc && <span className="error-message">{errors.total_ctc}</span>}
              </div>
            </div>
          )}

          {/* Step 4: Selection Process */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Selection Process</h3>
              
              <div className="form-group">
                <label>Selection Rounds *</label>
                <div className="skill-input-group">
                  <input
                    type="text"
                    value={roundInput}
                    onChange={(e) => setRoundInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRound())}
                    placeholder="e.g., Aptitude Test, Technical Interview"
                  />
                  <button type="button" onClick={addRound} className="add-button">Add Round</button>
                </div>
                <div className="skill-tags">
                  {formData.selection_process.rounds.map((round, index) => (
                    <span key={index} className="skill-tag">
                      {index + 1}. {round}
                      <button type="button" onClick={() => removeRound(index)}>×</button>
                    </span>
                  ))}
                </div>
                {errors.rounds && <span className="error-message">{errors.rounds}</span>}
              </div>

              <div className="form-group">
                <label>Interview Mode *</label>
                <div className="radio-group">
                  {selectionModes.map(mode => (
                    <label key={mode} className="radio-label">
                      <input
                        type="radio"
                        name="selection_process.mode"
                        value={mode}
                        checked={formData.selection_process.mode === mode}
                        onChange={handleChange}
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Expected Timeline *</label>
                <textarea
                  name="selection_process.timeline"
                  value={formData.selection_process.timeline}
                  onChange={handleChange}
                  placeholder="e.g., 2 weeks from application to offer"
                  rows={3}
                  className={errors.timeline ? 'error' : ''}
                />
                {errors.timeline && <span className="error-message">{errors.timeline}</span>}
              </div>
            </div>
          )}

          {/* Step 5: Bond Terms & Deadline */}
          {currentStep === 5 && (
            <div className="form-step">
              <h3>Bond Terms & Application Deadline</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Bond Duration (Months)</label>
                  <input
                    type="number"
                    name="bond_terms.duration_months"
                    value={formData.bond_terms.duration_months}
                    onChange={handleChange}
                    min="0"
                    max="24"
                    placeholder="0 for no bond"
                    className={errors.bond_duration ? 'error' : ''}
                  />
                  <small>Maximum 24 months (2 years)</small>
                  {errors.bond_duration && <span className="error-message">{errors.bond_duration}</span>}
                </div>

                <div className="form-group">
                  <label>Bond Amount (INR)</label>
                  <input
                    type="number"
                    name="bond_terms.amount"
                    value={formData.bond_terms.amount}
                    onChange={handleChange}
                    min="0"
                    placeholder="0 for no bond"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Bond Terms & Conditions</label>
                <textarea
                  name="bond_terms.terms"
                  value={formData.bond_terms.terms}
                  onChange={handleChange}
                  placeholder="Describe bond terms, conditions, and exceptions..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Notice Period (Days)</label>
                <input
                  type="number"
                  name="bond_terms.notice_period_days"
                  value={formData.bond_terms.notice_period_days}
                  onChange={handleChange}
                  min="0"
                  max="90"
                  placeholder="e.g., 30"
                />
              </div>

              <div className="form-group">
                <label>Application Deadline *</label>
                <input
                  type="date"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.application_deadline ? 'error' : ''}
                />
                {errors.application_deadline && <span className="error-message">{errors.application_deadline}</span>}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} className="nav-button back-button">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            
            {currentStep < 5 ? (
              <button type="button" onClick={handleNext} className="nav-button next-button">
                Next
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button type="submit" className="nav-button submit-button">
                Submit for Approval
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

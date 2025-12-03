import { useState } from 'react';
import './StepForm.css';

export default function SkillsExperienceStep({ data, onSubmit, onBack, loading }) {
  const [formData, setFormData] = useState({
    skills: data.skills?.skills || [],
    projects: data.projects || [],
    certifications: data.certifications || [],
    internships: data.internships || [],
    competitive_profiles: data.competitive_profiles || {},
  });

  const [errors, setErrors] = useState({});

  // Skills Management
  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', level: 'Beginner' }]
    }));
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkill = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  // Projects Management
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { name: '', description: '', link: '', technologies: '' }]
    }));
  };

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) => 
        i === index ? { ...project, [field]: value } : project
      )
    }));
  };

  // Certifications Management
  const addCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { name: '', issuer: '', date: '' }]
    }));
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCertification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  // Internships Management
  const addInternship = () => {
    setFormData(prev => ({
      ...prev,
      internships: [...prev.internships, { company: '', role: '', duration: '', description: '' }]
    }));
  };

  const removeInternship = (index) => {
    setFormData(prev => ({
      ...prev,
      internships: prev.internships.filter((_, i) => i !== index)
    }));
  };

  const updateInternship = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      internships: prev.internships.map((intern, i) => 
        i === index ? { ...intern, [field]: value } : intern
      )
    }));
  };

  // Competitive Profiles
  const updateCompetitiveProfile = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      competitive_profiles: {
        ...prev.competitive_profiles,
        [platform]: value
      }
    }));
  };

  const validate = () => {
    const newErrors = {};

    // At least one skill required
    if (formData.skills.length === 0) {
      newErrors.skills = 'Please add at least one skill';
    } else {
      // Validate each skill has a name
      const invalidSkills = formData.skills.some(skill => !skill.name.trim());
      if (invalidSkills) {
        newErrors.skills = 'All skills must have a name';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Format data for backend
      const submitData = {
        skills: { skills: formData.skills },
        projects: formData.projects,
        certifications: formData.certifications,
        internships: formData.internships,
        competitive_profiles: formData.competitive_profiles,
      };
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="step-form">
      {/* Skills Section */}
      <div className="form-section">
        <h2 className="section-title">Technical Skills</h2>
        <p className="section-description">
          Add your technical skills and proficiency levels
        </p>

        <div className="dynamic-list">
          {formData.skills.map((skill, index) => (
            <div key={index} className="list-item">
              <div className="list-item-header">
                <span className="list-item-title">Skill {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="remove-btn"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Skill Name</label>
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, 'name', e.target.value)}
                    className="form-input"
                    placeholder="e.g., JavaScript, Python"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Proficiency Level</label>
                  <select
                    value={skill.level}
                    onChange={(e) => updateSkill(index, 'level', e.target.value)}
                    className="form-input"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addSkill} className="add-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Skill
        </button>
        {errors.skills && <span className="error-message">{errors.skills}</span>}
      </div>

      {/* Projects Section */}
      <div className="form-section">
        <h2 className="section-title">Projects</h2>
        <p className="section-description">
          Showcase your projects (optional)
        </p>

        <div className="dynamic-list">
          {formData.projects.map((project, index) => (
            <div key={index} className="list-item">
              <div className="list-item-header">
                <span className="list-item-title">Project {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="remove-btn"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => updateProject(index, 'name', e.target.value)}
                    className="form-input"
                    placeholder="e.g., E-commerce Website"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    className="form-input"
                    placeholder="Brief description of the project"
                    rows="2"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project Link</label>
                  <input
                    type="url"
                    value={project.link}
                    onChange={(e) => updateProject(index, 'link', e.target.value)}
                    className="form-input"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Technologies Used</label>
                  <input
                    type="text"
                    value={project.technologies}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value)}
                    className="form-input"
                    placeholder="React, Node.js, MongoDB"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addProject} className="add-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Project
        </button>
      </div>

      {/* Certifications Section */}
      <div className="form-section">
        <h2 className="section-title">Certifications</h2>
        <p className="section-description">
          Add your certifications (optional)
        </p>

        <div className="dynamic-list">
          {formData.certifications.map((cert, index) => (
            <div key={index} className="list-item">
              <div className="list-item-header">
                <span className="list-item-title">Certification {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="remove-btn"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Certificate Name</label>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    className="form-input"
                    placeholder="e.g., AWS Certified Developer"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Issuing Organization</label>
                  <input
                    type="text"
                    value={cert.issuer}
                    onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Amazon Web Services"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input
                    type="date"
                    value={cert.date}
                    onChange={(e) => updateCertification(index, 'date', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addCertification} className="add-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Certification
        </button>
      </div>

      {/* Internships Section */}
      <div className="form-section">
        <h2 className="section-title">Internships</h2>
        <p className="section-description">
          Add your internship experience (optional)
        </p>

        <div className="dynamic-list">
          {formData.internships.map((intern, index) => (
            <div key={index} className="list-item">
              <div className="list-item-header">
                <span className="list-item-title">Internship {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeInternship(index)}
                  className="remove-btn"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    value={intern.company}
                    onChange={(e) => updateInternship(index, 'company', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Tech Corp"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    value={intern.role}
                    onChange={(e) => updateInternship(index, 'role', e.target.value)}
                    className="form-input"
                    placeholder="e.g., Software Intern"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    value={intern.duration}
                    onChange={(e) => updateInternship(index, 'duration', e.target.value)}
                    className="form-input"
                    placeholder="e.g., 3 months"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Description</label>
                  <textarea
                    value={intern.description}
                    onChange={(e) => updateInternship(index, 'description', e.target.value)}
                    className="form-input"
                    placeholder="What did you work on?"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addInternship} className="add-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Internship
        </button>
      </div>

      {/* Competitive Profiles */}
      <div className="form-section">
        <h2 className="section-title">Competitive Programming Profiles</h2>
        <p className="section-description">
          Add your coding profile links (optional)
        </p>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">LeetCode</label>
            <input
              type="text"
              value={formData.competitive_profiles.leetcode || ''}
              onChange={(e) => updateCompetitiveProfile('leetcode', e.target.value)}
              className="form-input"
              placeholder="Username or profile URL"
            />
          </div>
          <div className="form-group">
            <label className="form-label">CodeChef</label>
            <input
              type="text"
              value={formData.competitive_profiles.codechef || ''}
              onChange={(e) => updateCompetitiveProfile('codechef', e.target.value)}
              className="form-input"
              placeholder="Username or profile URL"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Codeforces</label>
            <input
              type="text"
              value={formData.competitive_profiles.codeforces || ''}
              onChange={(e) => updateCompetitiveProfile('codeforces', e.target.value)}
              className="form-input"
              placeholder="Username or profile URL"
            />
          </div>
          <div className="form-group">
            <label className="form-label">HackerRank</label>
            <input
              type="text"
              value={formData.competitive_profiles.hackerrank || ''}
              onChange={(e) => updateCompetitiveProfile('hackerrank', e.target.value)}
              className="form-input"
              placeholder="Username or profile URL"
            />
          </div>
          <div className="form-group">
            <label className="form-label">GitHub</label>
            <input
              type="text"
              value={formData.competitive_profiles.github || ''}
              onChange={(e) => updateCompetitiveProfile('github', e.target.value)}
              className="form-input"
              placeholder="Username or profile URL"
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

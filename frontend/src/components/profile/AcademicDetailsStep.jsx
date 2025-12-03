import { useState } from 'react';
import './StepForm.css';

export default function AcademicDetailsStep({ data, onSubmit, onBack, loading }) {
  const [formData, setFormData] = useState({
    degree: data.degree || '',
    roll_number: data.roll_number || '',
    year_of_admission: data.year_of_admission || '',
    current_semester: data.current_semester || '',
    expected_graduation_year: data.expected_graduation_year || '',
    cgpi: data.cgpi || '',
    active_backlogs: data.active_backlogs || false,
    is_direct_second_year: data.is_direct_second_year || false,
    ssc_year_of_passing: data.ssc_year_of_passing || '',
    ssc_board: data.ssc_board || '',
    ssc_percentage: data.ssc_percentage || '',
    hsc_year_of_passing: data.hsc_year_of_passing || '',
    hsc_board: data.hsc_board || '',
    hsc_percentage: data.hsc_percentage || '',
    diploma_year_of_passing: data.diploma_year_of_passing || '',
    diploma_percentage: data.diploma_percentage || '',
  });

  const [errors, setErrors] = useState({});
  const [educationType, setEducationType] = useState(
    data.diploma_percentage ? 'diploma' : 'hsc'
  );
  const [uploading, setUploading] = useState({
    ssc: false,
    hsc: false,
    diploma: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    ssc_marksheet_url: data.ssc_marksheet_url || '',
    hsc_marksheet_url: data.hsc_marksheet_url || '',
    diploma_marksheet_url: data.diploma_marksheet_url || '',
  });

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF, JPG, JPEG, and PNG files are allowed');
      return;
    }

    setUploading(prev => ({ ...prev, [documentType.split('_')[0]]: true }));

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const response = await fetch('http://localhost:5000/api/public/upload/document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadedFiles(prev => ({
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
      setUploading(prev => ({ ...prev, [documentType.split('_')[0]]: false }));
    }
  };

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

  const validate = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear();

    // Degree
    if (!formData.degree) {
      newErrors.degree = 'Please select your degree';
    }

    // Year of Admission
    if (!formData.year_of_admission) {
      newErrors.year_of_admission = 'Year of admission is required';
    } else if (formData.year_of_admission < 2000 || formData.year_of_admission > currentYear) {
      newErrors.year_of_admission = 'Please enter a valid year';
    }

    // Current Semester
    if (!formData.current_semester) {
      newErrors.current_semester = 'Current semester is required';
    } else if (formData.current_semester < 1 || formData.current_semester > 8) {
      newErrors.current_semester = 'Semester must be between 1 and 8';
    }

    // Expected Graduation Year
    if (!formData.expected_graduation_year) {
      newErrors.expected_graduation_year = 'Expected graduation year is required';
    } else if (formData.expected_graduation_year <= formData.year_of_admission) {
      newErrors.expected_graduation_year = 'Graduation year must be after admission year';
    }

    // CGPI
    if (!formData.cgpi) {
      newErrors.cgpi = 'CGPI is required';
    } else if (formData.cgpi < 0 || formData.cgpi > 10) {
      newErrors.cgpi = 'CGPI must be between 0 and 10';
    }

    // SSC Details
    if (!formData.ssc_year_of_passing) {
      newErrors.ssc_year_of_passing = 'SSC year is required';
    }
    if (!formData.ssc_board) {
      newErrors.ssc_board = 'SSC board is required';
    }
    if (!formData.ssc_percentage) {
      newErrors.ssc_percentage = 'SSC percentage is required';
    } else if (formData.ssc_percentage < 0 || formData.ssc_percentage > 100) {
      newErrors.ssc_percentage = 'Percentage must be between 0 and 100';
    }

    // HSC or Diploma
    if (educationType === 'hsc') {
      if (!formData.hsc_year_of_passing) {
        newErrors.hsc_year_of_passing = 'HSC year is required';
      }
      if (!formData.hsc_board) {
        newErrors.hsc_board = 'HSC board is required';
      }
      if (!formData.hsc_percentage) {
        newErrors.hsc_percentage = 'HSC percentage is required';
      } else if (formData.hsc_percentage < 0 || formData.hsc_percentage > 100) {
        newErrors.hsc_percentage = 'Percentage must be between 0 and 100';
      }
    } else {
      if (!formData.diploma_year_of_passing) {
        newErrors.diploma_year_of_passing = 'Diploma year is required';
      }
      if (!formData.diploma_percentage) {
        newErrors.diploma_percentage = 'Diploma percentage is required';
      } else if (formData.diploma_percentage < 0 || formData.diploma_percentage > 100) {
        newErrors.diploma_percentage = 'Percentage must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // Clear unused fields based on education type
      const submitData = { ...formData };
      if (educationType === 'hsc') {
        submitData.diploma_year_of_passing = null;
        submitData.diploma_percentage = null;
      } else {
        submitData.hsc_year_of_passing = null;
        submitData.hsc_board = null;
        submitData.hsc_percentage = null;
      }
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="step-form">
      {/* Current Academic Details */}
      <div className="form-section">
        <h2 className="section-title">Current Academic Details</h2>
        
        <div className="form-grid">
          {/* Degree */}
          <div className="form-group">
            <label htmlFor="degree" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Degree <span className="required">*</span>
            </label>
            <select
              id="degree"
              name="degree"
              value={formData.degree}
              onChange={handleChange}
              className={`form-input ${errors.degree ? 'error' : ''}`}
            >
              <option value="">Select Degree</option>
              <option value="B.Tech">B.Tech</option>
              <option value="M.Tech">M.Tech</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="B.Sc">B.Sc</option>
              <option value="M.Sc">M.Sc</option>
            </select>
            {errors.degree && <span className="error-message">{errors.degree}</span>}
          </div>

          {/* Roll Number */}
          <div className="form-group">
            <label htmlFor="roll_number" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Roll Number
            </label>
            <input
              type="text"
              id="roll_number"
              name="roll_number"
              value={formData.roll_number}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter roll number"
            />
          </div>

          {/* Year of Admission */}
          <div className="form-group">
            <label htmlFor="year_of_admission" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Year of Admission <span className="required">*</span>
            </label>
            <input
              type="number"
              id="year_of_admission"
              name="year_of_admission"
              value={formData.year_of_admission}
              onChange={handleChange}
              className={`form-input ${errors.year_of_admission ? 'error' : ''}`}
              placeholder="e.g., 2020"
              min="2000"
              max={new Date().getFullYear()}
            />
            {errors.year_of_admission && <span className="error-message">{errors.year_of_admission}</span>}
          </div>

          {/* Current Semester */}
          <div className="form-group">
            <label htmlFor="current_semester" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Current Semester <span className="required">*</span>
            </label>
            <select
              id="current_semester"
              name="current_semester"
              value={formData.current_semester}
              onChange={handleChange}
              className={`form-input ${errors.current_semester ? 'error' : ''}`}
            >
              <option value="">Select Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
            {errors.current_semester && <span className="error-message">{errors.current_semester}</span>}
          </div>

          {/* Expected Graduation Year */}
          <div className="form-group">
            <label htmlFor="expected_graduation_year" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expected Graduation <span className="required">*</span>
            </label>
            <input
              type="number"
              id="expected_graduation_year"
              name="expected_graduation_year"
              value={formData.expected_graduation_year}
              onChange={handleChange}
              className={`form-input ${errors.expected_graduation_year ? 'error' : ''}`}
              placeholder="e.g., 2024"
              min={new Date().getFullYear()}
            />
            {errors.expected_graduation_year && <span className="error-message">{errors.expected_graduation_year}</span>}
          </div>

          {/* CGPI */}
          <div className="form-group">
            <label htmlFor="cgpi" className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Current CGPI <span className="required">*</span>
            </label>
            <input
              type="number"
              id="cgpi"
              name="cgpi"
              value={formData.cgpi}
              onChange={handleChange}
              className={`form-input ${errors.cgpi ? 'error' : ''}`}
              placeholder="e.g., 8.5"
              step="0.01"
              min="0"
              max="10"
            />
            {errors.cgpi && <span className="error-message">{errors.cgpi}</span>}
          </div>

          {/* Active Backlogs */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="active_backlogs"
                checked={formData.active_backlogs}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">I have active backlogs</span>
            </label>
          </div>

          {/* Direct Second Year */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_direct_second_year"
                checked={formData.is_direct_second_year}
                onChange={handleChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">Direct Second Year Entry</span>
            </label>
          </div>
        </div>
      </div>

      {/* SSC/10th Details */}
      <div className="form-section">
        <h2 className="section-title">SSC / 10th Standard Details</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="ssc_year_of_passing" className="form-label">
              Year of Passing <span className="required">*</span>
            </label>
            <input
              type="number"
              id="ssc_year_of_passing"
              name="ssc_year_of_passing"
              value={formData.ssc_year_of_passing}
              onChange={handleChange}
              className={`form-input ${errors.ssc_year_of_passing ? 'error' : ''}`}
              placeholder="e.g., 2018"
              min="2000"
              max={new Date().getFullYear()}
            />
            {errors.ssc_year_of_passing && <span className="error-message">{errors.ssc_year_of_passing}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ssc_board" className="form-label">
              Board <span className="required">*</span>
            </label>
            <input
              type="text"
              id="ssc_board"
              name="ssc_board"
              value={formData.ssc_board}
              onChange={handleChange}
              className={`form-input ${errors.ssc_board ? 'error' : ''}`}
              placeholder="e.g., CBSE, ICSE, State Board"
            />
            {errors.ssc_board && <span className="error-message">{errors.ssc_board}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ssc_percentage" className="form-label">
              Percentage <span className="required">*</span>
            </label>
            <input
              type="number"
              id="ssc_percentage"
              name="ssc_percentage"
              value={formData.ssc_percentage}
              onChange={handleChange}
              className={`form-input ${errors.ssc_percentage ? 'error' : ''}`}
              placeholder="e.g., 85.5"
              step="0.01"
              min="0"
              max="100"
            />
            {errors.ssc_percentage && <span className="error-message">{errors.ssc_percentage}</span>}
          </div>

          {/* SSC Marksheet Upload */}
          <div className="form-group full-width">
            <label className="form-label">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              SSC Marksheet (Optional)
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                id="ssc_marksheet"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, 'ssc_marksheet')}
                className="file-input"
                disabled={uploading.ssc}
              />
              <label htmlFor="ssc_marksheet" className="file-upload-label">
                {uploading.ssc ? (
                  <>
                    <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : uploadedFiles.ssc_marksheet_url ? (
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
                    Choose File (PDF, JPG, PNG - Max 5MB)
                  </>
                )}
              </label>
              {uploadedFiles.ssc_marksheet_url && (
                <a
                  href={`http://localhost:5000${uploadedFiles.ssc_marksheet_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-view-link"
                >
                  View Uploaded File
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HSC/Diploma Selection */}
      <div className="form-section">
        <h2 className="section-title">HSC / 12th or Diploma Details</h2>
        
        <div className="education-type-selector">
          <button
            type="button"
            className={`type-btn ${educationType === 'hsc' ? 'active' : ''}`}
            onClick={() => setEducationType('hsc')}
          >
            HSC / 12th Standard
          </button>
          <button
            type="button"
            className={`type-btn ${educationType === 'diploma' ? 'active' : ''}`}
            onClick={() => setEducationType('diploma')}
          >
            Diploma
          </button>
        </div>

        {educationType === 'hsc' ? (
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="hsc_year_of_passing" className="form-label">
                Year of Passing <span className="required">*</span>
              </label>
              <input
                type="number"
                id="hsc_year_of_passing"
                name="hsc_year_of_passing"
                value={formData.hsc_year_of_passing}
                onChange={handleChange}
                className={`form-input ${errors.hsc_year_of_passing ? 'error' : ''}`}
                placeholder="e.g., 2020"
                min="2000"
                max={new Date().getFullYear()}
              />
              {errors.hsc_year_of_passing && <span className="error-message">{errors.hsc_year_of_passing}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hsc_board" className="form-label">
                Board <span className="required">*</span>
              </label>
              <input
                type="text"
                id="hsc_board"
                name="hsc_board"
                value={formData.hsc_board}
                onChange={handleChange}
                className={`form-input ${errors.hsc_board ? 'error' : ''}`}
                placeholder="e.g., CBSE, ICSE, State Board"
              />
              {errors.hsc_board && <span className="error-message">{errors.hsc_board}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="hsc_percentage" className="form-label">
                Percentage <span className="required">*</span>
              </label>
              <input
                type="number"
                id="hsc_percentage"
                name="hsc_percentage"
                value={formData.hsc_percentage}
                onChange={handleChange}
                className={`form-input ${errors.hsc_percentage ? 'error' : ''}`}
                placeholder="e.g., 88.0"
                step="0.01"
                min="0"
                max="100"
              />
              {errors.hsc_percentage && <span className="error-message">{errors.hsc_percentage}</span>}
            </div>

            {/* HSC Marksheet Upload */}
            <div className="form-group full-width">
              <label className="form-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                HSC Marksheet (Optional)
              </label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="hsc_marksheet"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'hsc_marksheet')}
                  className="file-input"
                  disabled={uploading.hsc}
                />
                <label htmlFor="hsc_marksheet" className="file-upload-label">
                  {uploading.hsc ? (
                    <>
                      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : uploadedFiles.hsc_marksheet_url ? (
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
                      Choose File (PDF, JPG, PNG - Max 5MB)
                    </>
                  )}
                </label>
                {uploadedFiles.hsc_marksheet_url && (
                  <a
                    href={`http://localhost:5000${uploadedFiles.hsc_marksheet_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-view-link"
                  >
                    View Uploaded File
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="diploma_year_of_passing" className="form-label">
                Year of Passing <span className="required">*</span>
              </label>
              <input
                type="number"
                id="diploma_year_of_passing"
                name="diploma_year_of_passing"
                value={formData.diploma_year_of_passing}
                onChange={handleChange}
                className={`form-input ${errors.diploma_year_of_passing ? 'error' : ''}`}
                placeholder="e.g., 2020"
                min="2000"
                max={new Date().getFullYear()}
              />
              {errors.diploma_year_of_passing && <span className="error-message">{errors.diploma_year_of_passing}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="diploma_percentage" className="form-label">
                Percentage <span className="required">*</span>
              </label>
              <input
                type="number"
                id="diploma_percentage"
                name="diploma_percentage"
                value={formData.diploma_percentage}
                onChange={handleChange}
                className={`form-input ${errors.diploma_percentage ? 'error' : ''}`}
                placeholder="e.g., 82.5"
                step="0.01"
                min="0"
                max="100"
              />
              {errors.diploma_percentage && <span className="error-message">{errors.diploma_percentage}</span>}
            </div>

            {/* Diploma Marksheet Upload */}
            <div className="form-group full-width">
              <label className="form-label">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Diploma Marksheet (Optional)
              </label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="diploma_marksheet"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'diploma_marksheet')}
                  className="file-input"
                  disabled={uploading.diploma}
                />
                <label htmlFor="diploma_marksheet" className="file-upload-label">
                  {uploading.diploma ? (
                    <>
                      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : uploadedFiles.diploma_marksheet_url ? (
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
                      Choose File (PDF, JPG, PNG - Max 5MB)
                    </>
                  )}
                </label>
                {uploadedFiles.diploma_marksheet_url && (
                  <a
                    href={`http://localhost:5000${uploadedFiles.diploma_marksheet_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-view-link"
                  >
                    View Uploaded File
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
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

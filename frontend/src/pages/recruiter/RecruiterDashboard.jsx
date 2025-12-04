import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Waves from '../../components/common/Waves';
import JobPostingForm from '../../components/recruiter/JobPostingForm';
import Toast from '../../components/common/Toast';
import './RecruiterDashboard.css';

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('job-posting');
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [poc, setPoc] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'ROLE_RECRUITER') {
      navigate('/login?role=recruiter');
      return;
    }

    // Load user data from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const orgData = JSON.parse(localStorage.getItem('organization') || '{}');
      const pocData = JSON.parse(localStorage.getItem('poc') || '{}');
      
      console.log('Loaded user data:', userData);
      console.log('Loaded organization data:', orgData);
      console.log('Loaded POC data:', pocData);
      
      setUser(userData);
      setOrganization(orgData);
      setPoc(pocData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [navigate]);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    localStorage.removeItem('poc');
    
    // Redirect to login
    navigate('/login?role=recruiter');
  };

  const getInitials = (name) => {
    if (!name) return 'R';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const handleJobSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('accessToken');
      const userRole = localStorage.getItem('userRole');
      
      console.log('Submitting job posting...');
      console.log('User role:', userRole);
      console.log('Form data:', formData);
      
      const response = await fetch('http://localhost:5000/api/public/recruiters/jobs/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok && data.success) {
        showToast('Job posting submitted for approval! 🎉', 'success');
        setShowJobForm(false);
        // TODO: Refresh job postings list
      } else {
        const errorMsg = data.error || data.message || 'Failed to create job posting';
        console.error('Job posting failed:', errorMsg);
        showToast(errorMsg, 'error');
        alert(`Error: ${errorMsg}\n\nStatus: ${response.status}\n\nPlease check console for details.`);
      }
    } catch (error) {
      console.error('Job posting error:', error);
      showToast('Network error. Please try again.', 'error');
      alert(`Network Error: ${error.message}`);
    }
  };

  return (
    <div className="recruiter-dashboard">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      {/* Job Posting Form Modal */}
      {showJobForm && (
        <JobPostingForm
          onClose={() => setShowJobForm(false)}
          onSubmit={handleJobSubmit}
        />
      )}
      {/* Waves Background */}
      <div className="dashboard-waves-background">
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
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          {/* Logo/Brand */}
          <div className="header-brand">
            <div className="brand-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="brand-text">
              <h1>{organization?.name || organization?.org_name || 'Recruiter'}</h1>
              <p>{organization?.status === 'VERIFIED' ? 'Verified Partner' : 'Partner'}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="header-nav">
            <button
              className={`nav-item ${activeTab === 'job-posting' ? 'active' : ''}`}
              onClick={() => setActiveTab('job-posting')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Job Posting</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
            </button>
            <button
              className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Applications</span>
            </button>
          </nav>

          {/* User Menu */}
          <div className="header-user">
            <div 
              className="user-avatar"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="avatar-circle">
                {getInitials(poc?.name || poc?.poc_name || user?.email)}
              </div>
              <div className="user-info">
                <span className="user-name">{poc?.name || poc?.poc_name || 'User'}</span>
                <span className="user-role">{poc?.designation || 'Recruiter'}</span>
              </div>
              <svg 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                className={`dropdown-icon ${showUserMenu ? 'open' : ''}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <p className="dropdown-name">{poc?.name || poc?.poc_name || 'User'}</p>
                  <p className="dropdown-email">{user?.email || 'No email'}</p>
                </div>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={() => setActiveTab('profile')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </button>
                <button className="dropdown-item" onClick={() => setActiveTab('settings')}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Job Posting Tab */}
          {activeTab === 'job-posting' && (
            <div className="tab-content">
              <div className="content-header">
                <div>
                  <h2>Job Posting</h2>
                  <p>Create and manage your job postings</p>
                </div>
                <button 
                  className="create-job-button"
                  onClick={() => setShowJobForm(true)}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Job Posting
                </button>
              </div>
              <div className="job-postings-list">
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3>No Job Postings Yet</h3>
                  <p>Click "Create Job Posting" to post your first job opportunity</p>
                  <button 
                    className="empty-action-button"
                    onClick={() => setShowJobForm(true)}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Job History</h2>
                <p>View all your past and current job postings</p>
              </div>
              <div className="coming-soon-card">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>Job History</h3>
                <p>Track all your job postings and their performance</p>
                <ul className="feature-list">
                  <li>✅ View all job postings</li>
                  <li>✅ Filter by status</li>
                  <li>✅ See application statistics</li>
                  <li>✅ Download reports</li>
                </ul>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Applications</h2>
                <p>Review and manage student applications</p>
              </div>
              <div className="coming-soon-card">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3>Applications</h3>
                <p>Manage student applications and shortlist candidates</p>
                <ul className="feature-list">
                  <li>✅ View all applications</li>
                  <li>✅ Filter and search candidates</li>
                  <li>✅ Shortlist applicants</li>
                  <li>✅ Schedule interviews</li>
                </ul>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Profile</h2>
                <p>Manage your organization profile</p>
              </div>
              <div className="profile-card">
                <div className="profile-section">
                  <h3>Organization Details</h3>
                  <div className="profile-grid">
                    <div className="profile-item">
                      <span className="profile-label">Company Name:</span>
                      <span className="profile-value">{organization?.name || organization?.org_name || 'N/A'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="profile-label">Status:</span>
                      <span className={`status-badge status-${organization?.status?.toLowerCase()}`}>
                        {organization?.status || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="profile-section">
                  <h3>Point of Contact</h3>
                  <div className="profile-grid">
                    <div className="profile-item">
                      <span className="profile-label">Name:</span>
                      <span className="profile-value">{poc?.name || poc?.poc_name || 'N/A'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="profile-label">Designation:</span>
                      <span className="profile-value">{poc?.designation || 'N/A'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="profile-label">Email:</span>
                      <span className="profile-value">{user?.email || poc?.email || 'N/A'}</span>
                    </div>
                    <div className="profile-item">
                      <span className="profile-label">Department:</span>
                      <span className="profile-value">{poc?.department || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="content-header">
                <h2>Settings</h2>
                <p>Manage your account settings</p>
              </div>
              <div className="coming-soon-card">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3>Settings</h3>
                <p>Configure your account preferences</p>
                <ul className="feature-list">
                  <li>✅ Change password</li>
                  <li>✅ Update contact information</li>
                  <li>✅ Notification preferences</li>
                  <li>✅ Privacy settings</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from '../../components/common/Galaxy';
import StudentDashboardHeader from '../../components/dashboard/StudentDashboardHeader';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'ROLE_STUDENT') {
      navigate('/login?role=student');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    navigate('/login?role=student');
  };

  return (
    <div className="student-dashboard">
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

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Header */}
        <StudentDashboardHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="coming-soon-title">Complete Your Profile</h2>
                <p className="coming-soon-description">
                  Fill in your details to unlock job opportunities and get verified by TPO.
                </p>
                <button 
                  className="complete-profile-btn"
                  onClick={() => navigate('/student/profile-completion')}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Complete Profile Now
                </button>
              </div>
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="coming-soon-title">Placement Status</h2>
                <p className="coming-soon-description">
                  Track your placement journey, view statistics, and monitor progress.
                </p>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="tab-content">
              <div className="coming-soon-container">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="coming-soon-title">Job Applications</h2>
                <p className="coming-soon-description">
                  Browse jobs, submit applications, and track your application status.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

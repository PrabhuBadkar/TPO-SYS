import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Galaxy from '../../components/common/Galaxy';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const navigate = useNavigate();

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
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back!</p>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="logout-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="coming-soon-container">
            <div className="coming-soon-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="coming-soon-title">Dashboard Coming Soon</h2>
            <p className="coming-soon-description">
              We're building an amazing dashboard experience for you.
              Stay tuned for updates!
            </p>
            <div className="coming-soon-features">
              <div className="feature-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Profile Management</span>
              </div>
              <div className="feature-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Job Applications</span>
              </div>
              <div className="feature-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Resume Builder</span>
              </div>
              <div className="feature-item">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Interview Schedules</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

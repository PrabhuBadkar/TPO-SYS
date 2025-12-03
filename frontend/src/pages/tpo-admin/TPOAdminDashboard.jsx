import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Silk from '../../components/common/Silk';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import LandingDashboard from '../../components/dashboard/LandingDashboard';
import StudentsTab from '../../components/dashboard/StudentsTab';
import './TPOAdminDashboard.css';

export default function TPOAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('accessToken');

    if (!user || !token || user.role !== 'ROLE_TPO_ADMIN') {
      // Redirect to login if not authenticated or not admin
      navigate('/tpo-admin/login');
    }
  }, [navigate]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="tpo-admin-dashboard">
      {/* Silk Background */}
      <div className="dashboard-silk-background">
        <Silk
          speed={5}
          scale={1}
          color="#7B3FF2"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content-wrapper">
        {/* Header with Logo, Nav, Avatar */}
        <DashboardHeader 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
        />

        {/* Main Content Area */}
        <div className="dashboard-main-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <LandingDashboard />
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="tab-content">
              <StudentsTab />
            </div>
          )}

          {/* Recruiters Tab */}
          {activeTab === 'recruiters' && (
            <div className="tab-content">
              <div className="content-header">
                <h2 className="content-title">Recruiters Management</h2>
                <p className="content-subtitle">
                  Manage company registrations, verifications, and partnerships.
                </p>
              </div>
              <div className="coming-soon-card">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3>Recruiters Tab</h3>
                <p>Recruiter management features coming soon...</p>
                <ul className="feature-list">
                  <li>✅ View all recruiters</li>
                  <li>✅ Pending verifications</li>
                  <li>✅ Document verification</li>
                  <li>✅ Blacklist management</li>
                </ul>
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="tab-content">
              <div className="content-header">
                <h2 className="content-title">Job Postings Management</h2>
                <p className="content-subtitle">
                  Manage job postings, approvals, and applications.
                </p>
              </div>
              <div className="coming-soon-card">
                <div className="coming-soon-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3>Job Postings Tab</h3>
                <p>Job management features coming soon...</p>
                <ul className="feature-list">
                  <li>✅ View all job postings</li>
                  <li>✅ Pending approvals</li>
                  <li>✅ Application tracking</li>
                  <li>✅ Analytics & reports</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

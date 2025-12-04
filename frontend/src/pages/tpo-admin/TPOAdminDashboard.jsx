import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Silk from '../../components/common/Silk';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import LandingDashboard from '../../components/dashboard/LandingDashboard';
import StudentsTab from '../../components/dashboard/StudentsTab';
import RecruitersTab from '../../components/dashboard/RecruitersTab';
import JobPostingsTab from '../../components/dashboard/JobPostingsTab';
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
              <RecruitersTab />
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="tab-content">
              <JobPostingsTab />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

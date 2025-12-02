import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Silk from '../../components/common/Silk';
import './TPOAdminDashboard.css';

export default function TPOAdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('accessToken');

    if (!user || !token || user.role !== 'ROLE_TPO_ADMIN') {
      // Redirect to login if not authenticated or not admin
      navigate('/tpo-admin/login');
    }
  }, [navigate]);

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
      <div className="dashboard-content">
        {/* Content will be added here */}
      </div>
    </div>
  );
}

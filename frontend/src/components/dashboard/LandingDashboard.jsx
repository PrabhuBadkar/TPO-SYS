import { useState, useEffect } from 'react';
import './LandingDashboard.css';

export default function LandingDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:5000/api/internal/admin/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-dashboard">
        <div className="landing-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="landing-card loading">
              <div className="card-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-dashboard">
        <div className="landing-error">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
          <button onClick={fetchStats} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'total-students',
      title: 'Total Students',
      value: stats?.students?.total || 0,
      subtitle: `+${stats?.students?.newThisMonth || 0} this month`,
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      glowColor: 'rgba(102, 126, 234, 0.5)',
      particles: true,
    },
    {
      id: 'students-placed',
      title: 'Students Placed',
      value: 0, // TODO: Add to backend
      subtitle: 'Successful placements',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      glowColor: 'rgba(240, 147, 251, 0.5)',
      particles: true,
    },
    {
      id: 'total-recruiters',
      title: 'Total Recruiters',
      value: stats?.recruiters?.active || 0,
      subtitle: `${stats?.recruiters?.recentlyVerified || 0} verified recently`,
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      glowColor: 'rgba(79, 172, 254, 0.5)',
      particles: true,
    },
    {
      id: 'active-jobs',
      title: 'Active Jobs',
      value: stats?.jobs?.active || 0,
      subtitle: `${stats?.jobs?.pendingApproval || 0} pending approval`,
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      glowColor: 'rgba(67, 233, 123, 0.5)',
      particles: true,
    },
  ];

  return (
    <div className="landing-dashboard">
      <div className="landing-grid">
        {cards.map((card, index) => (
          <div 
            key={card.id} 
            className="landing-card"
            style={{ 
              '--gradient': card.gradient,
              '--glow-color': card.glowColor,
              '--delay': `${index * 0.1}s`
            }}
          >
            {/* Animated Background */}
            <div className="card-bg"></div>
            
            {/* Particles */}
            {card.particles && (
              <div className="card-particles">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="particle"
                    style={{
                      '--x': `${Math.random() * 100}%`,
                      '--y': `${Math.random() * 100}%`,
                      '--duration': `${3 + Math.random() * 4}s`,
                      '--delay': `${Math.random() * 2}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="card-content">
              {/* Icon */}
              <div className="card-icon">
                {card.icon}
              </div>

              {/* Stats */}
              <div className="card-stats">
                <h3 className="card-title">{card.title}</h3>
                <div className="card-value-wrapper">
                  <span className="card-value">{card.value}</span>
                  <div className="value-glow"></div>
                </div>
                <p className="card-subtitle">{card.subtitle}</p>
              </div>

              {/* Decorative Elements */}
              <div className="card-decoration">
                <div className="decoration-circle decoration-circle-1"></div>
                <div className="decoration-circle decoration-circle-2"></div>
                <div className="decoration-circle decoration-circle-3"></div>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="card-shine"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

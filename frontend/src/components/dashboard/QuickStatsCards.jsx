import { useState, useEffect } from 'react';
import './QuickStatsCards.css';

export default function QuickStatsCards() {
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
      <div className="quick-stats-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stat-card loading">
            <div className="stat-skeleton"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-error">
        <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{error}</p>
        <button onClick={fetchStats} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="quick-stats-grid">
      {/* Card 1: Total Students */}
      <div className="stat-card stat-card-purple">
        <div className="stat-icon-wrapper stat-icon-purple">
          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <div className="stat-content">
          <h3 className="stat-label">Total Students</h3>
          <p className="stat-value">{stats?.students?.total || 0}</p>
          <div className="stat-trend stat-trend-up">
            <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{stats?.students?.newThisMonth || 0} this month</span>
          </div>
        </div>
      </div>

      {/* Card 2: Pending Verifications */}
      <div className="stat-card stat-card-orange">
        <div className="stat-icon-wrapper stat-icon-orange">
          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="stat-content">
          <h3 className="stat-label">Pending Reviews</h3>
          <p className="stat-value">{stats?.verifications?.pending || 0}</p>
          <div className={`stat-trend ${stats?.verifications?.urgent > 0 ? 'stat-trend-urgent' : 'stat-trend-neutral'}`}>
            <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{stats?.verifications?.urgent || 0} urgent</span>
          </div>
        </div>
      </div>

      {/* Card 3: Active Recruiters */}
      <div className="stat-card stat-card-blue">
        <div className="stat-icon-wrapper stat-icon-blue">
          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="stat-content">
          <h3 className="stat-label">Active Recruiters</h3>
          <p className="stat-value">{stats?.recruiters?.active || 0}</p>
          <div className="stat-trend stat-trend-success">
            <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{stats?.recruiters?.recentlyVerified || 0} verified</span>
          </div>
        </div>
      </div>

      {/* Card 4: Active Job Postings */}
      <div className="stat-card stat-card-green">
        <div className="stat-icon-wrapper stat-icon-green">
          <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <div className="stat-content">
          <h3 className="stat-label">Active Jobs</h3>
          <p className="stat-value">{stats?.jobs?.active || 0}</p>
          <div className={`stat-trend ${stats?.jobs?.pendingApproval > 0 ? 'stat-trend-warning' : 'stat-trend-neutral'}`}>
            <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{stats?.jobs?.pendingApproval || 0} pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

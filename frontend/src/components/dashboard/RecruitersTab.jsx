import { useState, useEffect } from 'react';
import './RecruitersTab.css';

export default function RecruitersTab() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });
  const [recruiters, setRecruiters] = useState([]);
  const [filteredRecruiters, setFilteredRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Check user role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('accessToken');
    console.log('Current user:', user);
    console.log('Has token:', !!token);
    console.log('User role:', user.role);
    
    if (user.role !== 'ROLE_TPO_ADMIN') {
      console.warn('⚠️ User is not TPO Admin! Role:', user.role);
    }
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterRecruiters();
  }, [activeFilter, recruiters]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('Fetching recruiters data...');
      
      const response = await fetch('http://localhost:5000/api/internal/admin/recruiters/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Recruiters response:', data);

      if (response.ok && data.success) {
        console.log(`Received ${data.data.length} recruiters`);
        console.log('Raw data:', data.data);
        
        setRecruiters(data.data);
        
        // Calculate stats
        const pending = data.data.filter(r => r.recruiter_status === 'PENDING_VERIFICATION');
        const verified = data.data.filter(r => r.recruiter_status === 'VERIFIED');
        const rejected = data.data.filter(r => r.recruiter_status === 'REJECTED');
        
        console.log('Pending:', pending.length, pending.map(r => r.org_name));
        console.log('Verified:', verified.length, verified.map(r => r.org_name));
        console.log('Rejected:', rejected.length, rejected.map(r => r.org_name));
        
        const stats = {
          total: data.data.length,
          pending: pending.length,
          verified: verified.length,
          rejected: rejected.length,
        };
        
        console.log('Calculated stats:', stats);
        setStats(stats);
      }

      setError(null);
    } catch (err) {
      console.error('Recruiters fetch error:', err);
      console.error('Error details:', err.message, err.stack);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Add a simple test function
  const testEndpoint = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Testing endpoint with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('http://localhost:5000/api/internal/admin/recruiters/test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Test endpoint response:', data);
      alert(`Database has ${data.count} organizations. Check console for details.`);
    } catch (err) {
      console.error('Test endpoint error:', err);
      alert('Test failed: ' + err.message);
    }
  };

  const filterRecruiters = () => {
    if (activeFilter === 'all') {
      setFilteredRecruiters(recruiters);
    } else if (activeFilter === 'pending') {
      setFilteredRecruiters(recruiters.filter(r => r.recruiter_status === 'PENDING_VERIFICATION'));
    } else if (activeFilter === 'verified') {
      setFilteredRecruiters(recruiters.filter(r => r.recruiter_status === 'VERIFIED'));
    } else if (activeFilter === 'rejected') {
      setFilteredRecruiters(recruiters.filter(r => r.recruiter_status === 'REJECTED'));
    }
  };

  const handleApprove = async (recruiterId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/recruiters/${recruiterId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh data
        await fetchAllData();
        setShowModal(false);
        setSelectedRecruiter(null);
      } else {
        alert(data.error || 'Failed to approve recruiter');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (recruiterId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/recruiters/${recruiterId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh data
        await fetchAllData();
        setShowModal(false);
        setSelectedRecruiter(null);
        setRejectionReason('');
      } else {
        alert(data.error || 'Failed to reject recruiter');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (recruiter) => {
    setSelectedRecruiter(recruiter);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecruiter(null);
    setRejectionReason('');
  };

  if (loading) {
    return (
      <div className="recruiters-tab">
        <div className="recruiters-layout">
          <div className="stat-cards-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="stat-card-compact loading">
                <div className="card-skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recruiters-tab">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
          <button onClick={fetchAllData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiters-tab">
      {/* Stats Cards */}
      <div className="stat-cards-grid">
        {/* Total Recruiters */}
        <div className="stat-card-enhanced stat-card-blue">
          <div className="card-background-pattern"></div>
          <div className="card-glow-effect"></div>
          <div className="card-content-wrapper">
            <div className="card-header-row">
              <div className="card-icon-enhanced">
                <div className="icon-glow"></div>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="card-badge">Total</div>
            </div>
            <div className="card-stats">
              <h3 className="card-label-enhanced">Total Recruiters</h3>
              <div className="card-value-row">
                <p className="card-value-enhanced">{stats.total}</p>
                <div className="value-decoration"></div>
              </div>
              <div className="card-footer">
                <div className="card-trend trend-neutral">
                  <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>All organizations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="stat-card-enhanced stat-card-orange">
          <div className="card-background-pattern"></div>
          <div className="card-glow-effect"></div>
          {stats.pending > 0 && <div className="pulse-indicator"></div>}
          <div className="card-content-wrapper">
            <div className="card-header-row">
              <div className="card-icon-enhanced">
                <div className="icon-glow"></div>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`card-badge ${stats.pending > 0 ? 'badge-urgent' : ''}`}>
                {stats.pending > 0 ? 'Action Required' : 'Clear'}
              </div>
            </div>
            <div className="card-stats">
              <h3 className="card-label-enhanced">Pending Approvals</h3>
              <div className="card-value-row">
                <p className="card-value-enhanced">{stats.pending}</p>
                <div className="value-decoration"></div>
              </div>
              <div className="card-footer">
                <div className={`card-trend ${stats.pending > 0 ? 'trend-urgent' : 'trend-neutral'}`}>
                  <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{stats.pending > 0 ? 'Requires action' : 'All clear'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Recruiters */}
        <div className="stat-card-enhanced stat-card-green">
          <div className="card-background-pattern"></div>
          <div className="card-glow-effect"></div>
          <div className="card-content-wrapper">
            <div className="card-header-row">
              <div className="card-icon-enhanced">
                <div className="icon-glow"></div>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="card-badge badge-success">Active</div>
            </div>
            <div className="card-stats">
              <h3 className="card-label-enhanced">Verified Recruiters</h3>
              <div className="card-value-row">
                <p className="card-value-enhanced">{stats.verified}</p>
                <div className="value-decoration"></div>
              </div>
              <div className="card-footer">
                <div className="card-trend trend-up">
                  <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Active partnerships</span>
                </div>
                <div className="progress-ring">
                  <svg width="40" height="40" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="rgba(74, 222, 128, 0.2)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="3"
                      strokeDasharray={`${(stats.verified / stats.total) * 100} 100`}
                      strokeLinecap="round"
                      transform="rotate(-90 20 20)"
                      className="progress-circle"
                    />
                  </svg>
                  <span className="progress-text">{stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Recruiters Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={testEndpoint}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(251, 191, 36, 0.2)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: '0.75rem',
              color: '#fbbf24',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Test DB
          </button>
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              fetchAllData();
            }}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '0.75rem',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'verified' ? 'active' : ''}`}
          onClick={() => setActiveFilter('verified')}
        >
          Verified ({stats.verified})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rejected')}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      {/* Recruiters List */}
      <div className="recruiters-list-card">
        <h3 className="list-title">
          {activeFilter === 'all' && 'All Recruiters'}
          {activeFilter === 'pending' && 'Pending Approvals'}
          {activeFilter === 'verified' && 'Verified Recruiters'}
          {activeFilter === 'rejected' && 'Rejected Recruiters'}
        </h3>
        
        <div className="recruiters-list">
          {filteredRecruiters.length > 0 ? (
            filteredRecruiters.map((recruiter, index) => (
              <div
                key={recruiter.id}
                className="recruiter-item"
                style={{ '--delay': `${index * 0.05}s` }}
                onClick={() => openModal(recruiter)}
              >
                <div className="recruiter-info">
                  <div className="recruiter-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="recruiter-details">
                    <h4 className="recruiter-name">{recruiter.org_name}</h4>
                    <p className="recruiter-meta">
                      {recruiter.industry} • {recruiter.pocs?.[0]?.poc_name || 'No POC'}
                    </p>
                  </div>
                </div>
                
                <div className="recruiter-status">
                  <span className={`status-badge status-${recruiter.recruiter_status.toLowerCase()}`}>
                    {recruiter.recruiter_status.replace('_', ' ')}
                  </span>
                  <span className="recruiter-date">
                    {new Date(recruiter.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">
              <p>No recruiters found</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedRecruiter && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recruiter Details</h2>
              <button className="modal-close" onClick={closeModal}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Company Info */}
              <div className="detail-section">
                <h3>Company Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Company Name:</span>
                    <span className="detail-value">{selectedRecruiter.org_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Website:</span>
                    <span className="detail-value">
                      <a href={selectedRecruiter.website} target="_blank" rel="noopener noreferrer">
                        {selectedRecruiter.website}
                      </a>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Industry:</span>
                    <span className="detail-value">{selectedRecruiter.industry}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Company Size:</span>
                    <span className="detail-value">{selectedRecruiter.size}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Headquarters:</span>
                    <span className="detail-value">{selectedRecruiter.headquarters}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Year Established:</span>
                    <span className="detail-value">{selectedRecruiter.year_established}</span>
                  </div>
                </div>
              </div>

              {/* Legal Info */}
              <div className="detail-section">
                <h3>Legal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">GST Number:</span>
                    <span className="detail-value">{selectedRecruiter.gst_number}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">CIN:</span>
                    <span className="detail-value">{selectedRecruiter.cin}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">PAN:</span>
                    <span className="detail-value">{selectedRecruiter.pan}</span>
                  </div>
                </div>
                <div className="document-links">
                  {selectedRecruiter.registration_cert_url && (
                    <a
                      href={`http://localhost:5000${selectedRecruiter.registration_cert_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-link"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Registration Certificate
                    </a>
                  )}
                  {selectedRecruiter.authorization_letter_url && (
                    <a
                      href={`http://localhost:5000${selectedRecruiter.authorization_letter_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="document-link"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Authorization Letter
                    </a>
                  )}
                </div>
              </div>

              {/* POC Info */}
              {selectedRecruiter.pocs && selectedRecruiter.pocs.length > 0 && (
                <div className="detail-section">
                  <h3>Point of Contact</h3>
                  {selectedRecruiter.pocs.map(poc => (
                    <div key={poc.id} className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{poc.poc_name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Designation:</span>
                        <span className="detail-value">{poc.designation}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{poc.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Mobile:</span>
                        <span className="detail-value">{poc.mobile_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rejection Reason (if rejected) */}
              {selectedRecruiter.recruiter_status === 'REJECTED' && selectedRecruiter.rejection_reason && (
                <div className="detail-section rejection-section">
                  <h3>Rejection Reason</h3>
                  <p className="rejection-reason">{selectedRecruiter.rejection_reason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedRecruiter.recruiter_status === 'PENDING_VERIFICATION' && (
                <div className="modal-actions">
                  <div className="rejection-input-group">
                    <textarea
                      placeholder="Rejection reason (required if rejecting)"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rejection-textarea"
                      rows="3"
                    />
                  </div>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleReject(selectedRecruiter.id)}
                      disabled={actionLoading}
                      className="btn-reject"
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRecruiter.id)}
                      disabled={actionLoading}
                      className="btn-approve"
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import './JobPostingsTab.css';

export default function JobPostingsTab() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    rejected: 0,
  });
  const [jobPostings, setJobPostings] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [modificationsRequested, setModificationsRequested] = useState('');

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterJobs();
  }, [activeFilter, jobPostings]);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('Fetching job postings...');
      
      const response = await fetch('http://localhost:5000/api/internal/admin/jobs/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Job postings response:', data);

      if (response.ok && data.success) {
        console.log(`Received ${data.data.length} job postings`);
        setJobPostings(data.data);
        
        // Calculate stats
        const stats = {
          total: data.data.length,
          pending: data.data.filter(j => j.status === 'PENDING_APPROVAL').length,
          active: data.data.filter(j => j.status === 'ACTIVE').length,
          rejected: data.data.filter(j => j.status === 'REJECTED').length,
        };
        
        console.log('Calculated stats:', stats);
        setStats(stats);
      }

      setError(null);
    } catch (err) {
      console.error('Job postings fetch error:', err);
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    if (activeFilter === 'all') {
      setFilteredJobs(jobPostings);
    } else if (activeFilter === 'pending') {
      setFilteredJobs(jobPostings.filter(j => j.status === 'PENDING_APPROVAL'));
    } else if (activeFilter === 'active') {
      setFilteredJobs(jobPostings.filter(j => j.status === 'ACTIVE'));
    } else if (activeFilter === 'rejected') {
      setFilteredJobs(jobPostings.filter(j => j.status === 'REJECTED'));
    }
  };

  const handleViewDetails = async (jobId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedJob(data.data);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Fetch job details error:', error);
      alert('Failed to fetch job details');
    }
  };

  const handlePreviewEligibility = async (jobId) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/jobs/${jobId}/preview-eligibility`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEligibilityData(data.data);
        setShowEligibilityModal(true);
      }
    } catch (error) {
      console.error('Preview eligibility error:', error);
      alert('Failed to preview eligibility');
    }
  };

  const handleApprove = async (jobId) => {
    if (!confirm('Are you sure you want to approve this job posting? Eligible students will be notified.')) {
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/jobs/${jobId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Job posting approved! ${data.data.eligible_students_count} eligible students will be notified.`);
        setShowModal(false);
        setShowEligibilityModal(false);
        fetchAllData(); // Refresh data
      } else {
        alert(data.error || 'Failed to approve job posting');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve job posting');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (jobId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/jobs/${jobId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Job posting rejected successfully');
        setShowModal(false);
        setRejectionReason('');
        fetchAllData(); // Refresh data
      } else {
        alert(data.error || 'Failed to reject job posting');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject job posting');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestModifications = async (jobId) => {
    if (!modificationsRequested.trim()) {
      alert('Please provide modification details');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/internal/admin/jobs/${jobId}/request-modifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modifications_requested: modificationsRequested }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Modification request sent to recruiter');
        setShowModal(false);
        setModificationsRequested('');
        fetchAllData(); // Refresh data
      } else {
        alert(data.error || 'Failed to request modifications');
      }
    } catch (error) {
      console.error('Request modifications error:', error);
      alert('Failed to request modifications');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING_APPROVAL': { text: 'Pending Approval', class: 'status-pending' },
      'ACTIVE': { text: 'Active', class: 'status-active' },
      'REJECTED': { text: 'Rejected', class: 'status-rejected' },
      'MODIFICATIONS_REQUESTED': { text: 'Modifications Requested', class: 'status-modifications' },
    };
    return badges[status] || { text: status, class: 'status-default' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading job postings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchAllData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="job-postings-tab">
      {/* Stats Cards */}
      <div className="stat-cards-grid">
        {/* Total Jobs */}
        <div className="stat-card-enhanced stat-card-blue">
          <div className="card-background-pattern"></div>
          <div className="card-glow-effect"></div>
          <div className="card-content-wrapper">
            <div className="card-header-row">
              <div className="card-icon-enhanced">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="icon-glow"></div>
              </div>
              <div className="card-badge">Total</div>
            </div>
            <div className="card-stats">
              <div className="card-label-enhanced">Total Job Postings</div>
              <div className="card-value-row">
                <div className="card-value-enhanced">{stats.total}</div>
                <div className="value-decoration"></div>
              </div>
              <div className="card-footer">
                <div className="card-trend trend-neutral">
                  <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>All postings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="stat-card-enhanced stat-card-orange">
          {stats.pending > 0 && <div className="pulse-indicator"></div>}
          <div className="card-background-pattern"></div>
          <div className="card-glow-effect"></div>
          <div className="card-content-wrapper">
            <div className="card-header-row">
              <div className="card-icon-enhanced">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="icon-glow"></div>
              </div>
              <div className={`card-badge ${stats.pending > 0 ? 'badge-urgent' : ''}`}>
                {stats.pending > 0 ? 'Action Required' : 'Clear'}
              </div>
            </div>
            <div className="card-stats">
              <div className="card-label-enhanced">Pending Approvals</div>
              <div className="card-value-row">
                <div className="card-value-enhanced">{stats.pending}</div>
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

        {/* Active Jobs */}
        <div className="stat-card-enhanced stat-card-green">
          <div className="card-background-pattern"></div>
          <div className="card-glow-effect"></div>
          <div className="card-content-wrapper">
            <div className="card-header-row">
              <div className="card-icon-enhanced">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="icon-glow"></div>
              </div>
              <div className="card-badge badge-success">Active</div>
            </div>
            <div className="card-stats">
              <div className="card-label-enhanced">Active Job Postings</div>
              <div className="card-value-row">
                <div className="card-value-enhanced">{stats.active}</div>
                <div className="value-decoration"></div>
              </div>
              <div className="card-footer">
                <div className="card-trend trend-up">
                  <svg className="trend-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Published to students</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffffff', margin: 0 }}>Job Postings Management</h2>
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
          className={`filter-tab ${activeFilter === 'active' ? 'active' : ''}`}
          onClick={() => setActiveFilter('active')}
        >
          Active ({stats.active})
        </button>
        <button
          className={`filter-tab ${activeFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rejected')}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      {/* Job Postings List */}
      <div className="jobs-list">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <p>No job postings found</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const badge = getStatusBadge(job.status);
            const criteria = job.eligibility_criteria;
            
            return (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <div className="job-info">
                    <h3>{job.job_title}</h3>
                    <p className="company-name">{job.organization.org_name}</p>
                  </div>
                  <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                </div>
                
                <div className="job-card-body">
                  <div className="job-detail">
                    <span className="label">Location:</span>
                    <span className="value">{job.work_location}</span>
                  </div>
                  <div className="job-detail">
                    <span className="label">Type:</span>
                    <span className="value">{job.employment_type}</span>
                  </div>
                  <div className="job-detail">
                    <span className="label">CGPA:</span>
                    <span className="value">≥ {criteria.cgpa_min}</span>
                  </div>
                  <div className="job-detail">
                    <span className="label">Branches:</span>
                    <span className="value">{criteria.allowed_branches?.join(', ')}</span>
                  </div>
                  <div className="job-detail">
                    <span className="label">Deadline:</span>
                    <span className="value">{new Date(job.application_deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="job-card-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => handleViewDetails(job.id)}
                  >
                    View Details
                  </button>
                  {job.status === 'PENDING_APPROVAL' && (
                    <button
                      className="btn-primary"
                      onClick={() => handlePreviewEligibility(job.id)}
                    >
                      Preview Eligibility
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Job Details Modal */}
      {showModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedJob.job_title}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Company Info */}
              <div className="modal-section">
                <h3>Company Information</h3>
                                <p><strong>Company:</strong> {selectedJob.organization.org_name}</p>
                <p><strong>Industry:</strong> {selectedJob.organization.industry}</p>
              </div>

              {/* Job Details */}
              <div className="modal-section">
                <h3>Job Details</h3>
                <p><strong>Description:</strong> {selectedJob.description}</p>
                <p><strong>Location:</strong> {selectedJob.work_location}</p>
                <p><strong>Type:</strong> {selectedJob.employment_type}</p>
                <p><strong>Skills:</strong> {selectedJob.required_skills.join(', ')}</p>
              </div>

              {/* Eligibility */}
              <div className="modal-section">
                <h3>Eligibility Criteria</h3>
                <p><strong>Degrees:</strong> {selectedJob.eligibility_criteria.degree?.join(', ')}</p>
                <p><strong>Branches:</strong> {selectedJob.eligibility_criteria.allowed_branches?.join(', ')}</p>
                <p><strong>Min CGPA:</strong> {selectedJob.eligibility_criteria.cgpa_min}</p>
                <p><strong>Max Backlogs:</strong> {selectedJob.eligibility_criteria.max_backlogs}</p>
              </div>

              {/* CTC */}
              <div className="modal-section">
                <h3>Compensation</h3>
                <p><strong>Total CTC:</strong> ₹{selectedJob.ctc_breakdown.total_ctc} LPA</p>
                <p><strong>Base Salary:</strong> ₹{selectedJob.ctc_breakdown.base_salary} LPA</p>
              </div>

              {/* Actions */}
              {selectedJob.status === 'PENDING_APPROVAL' && (
                <div className="modal-actions">
                  <button
                    className="btn-success"
                    onClick={() => handleApprove(selectedJob.id)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  
                  <div className="reject-section">
                    <textarea
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                    <button
                      className="btn-danger"
                      onClick={() => handleReject(selectedJob.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                  </div>

                  <div className="modifications-section">
                    <textarea
                      placeholder="Request modifications..."
                      value={modificationsRequested}
                      onChange={(e) => setModificationsRequested(e.target.value)}
                      rows={3}
                    />
                    <button
                      className="btn-warning"
                      onClick={() => handleRequestModifications(selectedJob.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Request Modifications'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Preview Modal */}
      {showEligibilityModal && eligibilityData && (
        <div className="modal-overlay" onClick={() => setShowEligibilityModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Eligibility Preview</h2>
              <button className="close-btn" onClick={() => setShowEligibilityModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="eligibility-stats">
                <div className="stat-box">
                  <h3>{eligibilityData.total_eligible}</h3>
                  <p>Total Eligible Students</p>
                </div>
              </div>

              <div className="modal-section">
                <h3>Department Breakdown</h3>
                <div className="breakdown-list">
                  {eligibilityData.department_breakdown.map((dept, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span>{dept.department}</span>
                      <span className="count">{dept.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h3>CGPA Distribution</h3>
                <div className="breakdown-list">
                  {eligibilityData.cgpa_distribution.slice(0, 5).map((cgpa, idx) => (
                    <div key={idx} className="breakdown-item">
                      <span>CGPA {cgpa.cgpa}</span>
                      <span className="count">{cgpa.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-success"
                  onClick={() => handleApprove(selectedJob.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : `Approve & Notify ${eligibilityData.total_eligible} Students`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

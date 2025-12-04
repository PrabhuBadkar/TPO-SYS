import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Waves from '../../components/common/Waves';
import './RecruiterRegister.css';

export default function RecruiterStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('recruiter_email');
    if (!email) {
      navigate('/register?role=recruiter');
      return;
    }

    fetchStatus(email);
  }, [navigate]);

  const fetchStatus = async (email) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/recruiter/status?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setStatus(data.data);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (error) {
      console.error('Status fetch error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status) return null;

    switch (status.status) {
      case 'PENDING_VERIFICATION':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem', height: '4rem', color: '#fbbf24' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'VERIFIED':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem', height: '4rem', color: '#4ade80' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'REJECTED':
        return (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem', height: '4rem', color: '#f87171' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    if (!status) return null;

    switch (status.status) {
      case 'PENDING_VERIFICATION':
        return {
          title: 'Registration Submitted Successfully!',
          message: 'Your registration is being reviewed by our TPO Admin team. You will receive an email notification once your account is approved.',
          color: '#fbbf24',
        };
      case 'VERIFIED':
        return {
          title: 'Account Approved!',
          message: 'Congratulations! Your account has been approved. You can now login and start posting jobs.',
          color: '#4ade80',
        };
      case 'REJECTED':
        return {
          title: 'Registration Requires Attention',
          message: status.rejection_reason || 'Your registration was not approved. Please contact support for more information.',
          color: '#f87171',
        };
      default:
        return null;
    }
  };

  return (
    <div className="recruiter-register">
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

      <div className="register-content">
        <div className="form-container" style={{ maxWidth: '600px', margin: '4rem auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <svg className="animate-spin" fill="none" viewBox="0 0 24 24" style={{ width: '3rem', height: '3rem', margin: '0 auto', color: '#a855f7' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p style={{ marginTop: '1rem', color: '#d8b4fe' }}>Loading status...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem', height: '4rem', margin: '0 auto', color: '#f87171' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 style={{ marginTop: '1.5rem', fontSize: '1.5rem', color: '#ffffff' }}>Error</h2>
              <p style={{ marginTop: '0.75rem', color: '#fca5a5' }}>{error}</p>
              <button
                onClick={() => navigate('/register?role=recruiter')}
                style={{
                  marginTop: '2rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back to Registration
              </button>
            </div>
          ) : status && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                {getStatusIcon()}
              </div>
              
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>
                {getStatusMessage()?.title}
              </h2>
              
              <div style={{
                padding: '1.5rem',
                background: `rgba(${status.status === 'PENDING_VERIFICATION' ? '251, 191, 36' : status.status === 'VERIFIED' ? '74, 222, 128' : '248, 113, 113'}, 0.1)`,
                border: `1px solid rgba(${status.status === 'PENDING_VERIFICATION' ? '251, 191, 36' : status.status === 'VERIFIED' ? '74, 222, 128' : '248, 113, 113'}, 0.3)`,
                borderRadius: '0.75rem',
                marginBottom: '2rem',
              }}>
                <p style={{ color: getStatusMessage()?.color, lineHeight: 1.6 }}>
                  {getStatusMessage()?.message}
                </p>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'rgba(168, 85, 247, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                borderRadius: '0.75rem',
                marginBottom: '2rem',
                textAlign: 'left',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#c084fc', fontSize: '0.875rem' }}>Organization:</span>
                  <span style={{ color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>{status.organization_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#c084fc', fontSize: '0.875rem' }}>Status:</span>
                  <span style={{ 
                    color: status.status === 'PENDING_VERIFICATION' ? '#fbbf24' : status.status === 'VERIFIED' ? '#4ade80' : '#f87171',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}>
                    {status.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#c084fc', fontSize: '0.875rem' }}>Submitted:</span>
                  <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                    {new Date(status.submitted_at).toLocaleDateString()}
                  </span>
                </div>
                {status.verified_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                    <span style={{ color: '#c084fc', fontSize: '0.875rem' }}>Verified:</span>
                    <span style={{ color: '#ffffff', fontSize: '0.875rem' }}>
                      {new Date(status.verified_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {status.status === 'VERIFIED' && (
                  <button
                    onClick={() => navigate('/login?role=recruiter')}
                    style={{
                      padding: '0.875rem 1.75rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Go to Login
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '0.875rem 1.75rem',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1.5px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '0.75rem',
                    color: '#c084fc',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

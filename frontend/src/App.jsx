import { Link } from 'react-router-dom';
import Squares from './components/common/Squares';
import CampusTitle from './components/common/CampusTitle';
import './App.css';

// Icon components - larger and more prominent
const GraduationCap = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const Briefcase = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Shield = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Users = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ArrowRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const LoginIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

const RegisterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated Squares Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <Squares 
          speed={0.3} 
          squareSize={50}
          direction='diagonal'
          borderColor='rgba(59, 130, 246, 0.2)'
          hoverFillColor='rgba(59, 130, 246, 0.08)'
        />
      </div>
      
      {/* Content wrapper with higher z-index */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="text-center relative z-10">
            <CampusTitle />
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-slate-300">
              A unified platform for Students, Recruiters, and TPO teams to connect and manage placements.
            </p>

            {/* Role Selection Cards */}
            <div className="mt-16">
              <h2 className="text-2xl font-semibold text-white mb-8">Choose Your Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                
                {/* Student Card - With Login and Register Buttons */}
                <div className="card-link-static group">
                  <div className="card-content">
                    <div className="icon-wrapper icon-blue">
                      <GraduationCap />
                    </div>
                    <h3 className="card-title">Student</h3>
                    <p className="card-description">
                      Discover jobs, apply, and track your placement journey
                    </p>
                    
                    {/* Dual Action Buttons */}
                    <div className="dual-action-buttons">
                      <Link to="/login?role=student" className="action-btn action-btn-login">
                        <LoginIcon />
                        <span>Login</span>
                      </Link>
                      <Link to="/register?role=student" className="action-btn action-btn-register">
                        <RegisterIcon />
                        <span>Register</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Recruiter Card */}
                <Link 
                  to="/login?role=recruiter" 
                  className="card-link group card-green"
                >
                  <div className="card-content">
                    <div className="icon-wrapper icon-green">
                      <Briefcase />
                    </div>
                    <h3 className="card-title">Recruiter</h3>
                    <p className="card-description">
                      Post jobs, review applications, and hire top talent
                    </p>
                    <div className="card-action text-green-400">
                      <span>Get Started</span>
                      <ArrowRight />
                    </div>
                  </div>
                </Link>

                {/* TPO Admin Card */}
                <Link 
                  to="/tpo-admin/login" 
                  className="card-link group card-purple"
                >
                  <div className="card-content">
                    <div className="icon-wrapper icon-purple">
                      <Shield />
                    </div>
                    <h3 className="card-title">TPO Admin</h3>
                    <p className="card-description">
                      Manage placements, approve jobs, and oversee operations
                    </p>
                    <div className="card-action text-purple-400">
                      <span>Get Started</span>
                      <ArrowRight />
                    </div>
                  </div>
                </Link>

                {/* TPO Dept Card */}
                <Link 
                  to="/login?role=tpo-dept" 
                  className="card-link group card-orange"
                >
                  <div className="card-content">
                    <div className="icon-wrapper icon-orange">
                      <Users />
                    </div>
                    <h3 className="card-title">TPO Dept</h3>
                    <p className="card-description">
                      Verify profiles, review applications, and support students
                    </p>
                    <div className="card-action text-orange-400">
                      <span>Get Started</span>
                      <ArrowRight />
                    </div>
                  </div>
                </Link>

              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

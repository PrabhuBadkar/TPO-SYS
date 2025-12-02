import { useState } from 'react'
import './App.css'

function App() {
  const [activeRole, setActiveRole] = useState(null)

  const roles = [
    {
      id: 'student',
      title: 'Student',
      icon: '🎓',
      description: 'Access your profile, apply for jobs, and track applications',
      features: ['View Job Postings', 'Submit Applications', 'Track Status', 'Upload Resume']
    },
    {
      id: 'recruiter',
      title: 'Recruiter',
      icon: '💼',
      description: 'Post jobs, review applications, and manage hiring process',
      features: ['Post Job Openings', 'Review Applications', 'Schedule Interviews', 'Extend Offers']
    },
    {
      id: 'tpo-admin',
      title: 'TPO Admin',
      icon: '👨‍💼',
      description: 'Manage placements, approve jobs, and oversee operations',
      features: ['Approve Job Postings', 'Manage Students', 'Analytics Dashboard', 'Communications']
    },
    {
      id: 'tpo-dept',
      title: 'TPO Department',
      icon: '📋',
      description: 'Verify student profiles and process applications',
      features: ['Verify Profiles', 'Review Applications', 'Department Reports', 'Event Management']
    }
  ]

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">🎯</span>
            <div className="logo-text">
              <h1>TPO Management System</h1>
              <p>ACER College</p>
            </div>
          </div>
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h2 className="hero-title">
              Streamline Your Campus Placements
            </h2>
            <p className="hero-subtitle">
              A comprehensive platform connecting students, recruiters, and placement officers
              for seamless campus recruitment management.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-number">500+</div>
                <div className="stat-label">Students</div>
              </div>
              <div className="stat">
                <div className="stat-number">100+</div>
                <div className="stat-label">Companies</div>
              </div>
              <div className="stat">
                <div className="stat-number">85%</div>
                <div className="stat-label">Placement Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="roles" id="features">
        <div className="container">
          <h2 className="section-title">Choose Your Portal</h2>
          <p className="section-subtitle">Select your role to access the platform</p>
          
          <div className="roles-grid">
            {roles.map((role) => (
              <div 
                key={role.id}
                className={`role-card ${activeRole === role.id ? 'active' : ''}`}
                onMouseEnter={() => setActiveRole(role.id)}
                onMouseLeave={() => setActiveRole(null)}
              >
                <div className="role-icon">{role.icon}</div>
                <h3 className="role-title">{role.title}</h3>
                <p className="role-description">{role.description}</p>
                <ul className="role-features">
                  {role.features.map((feature, index) => (
                    <li key={index}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="role-button">
                  Access Portal →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>Role-based access control with JWT authentication and MFA support</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>Real-time insights and comprehensive placement statistics</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📱</div>
              <h3>Multi-Channel Notifications</h3>
              <p>Email, SMS, and push notifications for important updates</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📅</div>
              <h3>Event Management</h3>
              <p>Schedule interviews, tests, and placement drives efficiently</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📄</div>
              <h3>Document Management</h3>
              <p>Secure upload and verification of resumes and certificates</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Smart Matching</h3>
              <p>Automatic eligibility checking based on criteria</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">About TPO System</h2>
            <p className="about-text">
              The TPO Management System is a comprehensive platform designed to streamline
              the entire campus placement process. From student profile management to
              recruiter engagement and administrative oversight, our system provides
              all the tools needed for successful campus placements.
            </p>
            <div className="about-highlights">
              <div className="highlight">
                <span className="highlight-icon">⚡</span>
                <span>Fast & Efficient</span>
              </div>
              <div className="highlight">
                <span className="highlight-icon">🔒</span>
                <span>Secure & Reliable</span>
              </div>
              <div className="highlight">
                <span className="highlight-icon">📈</span>
                <span>Data-Driven Insights</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>TPO Management System</h3>
              <p>ACER College</p>
              <p>Training & Placement Office</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>Email: tpo@acer.edu</p>
              <p>Phone: +91 XXX XXX XXXX</p>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <p>Help Center</p>
              <p>Documentation</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 ACER College. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

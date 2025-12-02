import DotGrid from '../../components/common/DotGrid';
import './StudentAuth.css';

export default function StudentLogin() {
  return (
    <div className="auth-page">
      {/* DotGrid Background */}
      <DotGrid
        dotSize={4}
        gap={40}
        baseColor="rgba(59, 130, 246, 0.3)"
        activeColor="rgba(59, 130, 246, 0.8)"
        proximity={120}
        className="auth-background"
      />
      
      {/* Content will go here */}
      <div className="auth-content" style={{ zIndex: 1, position: 'relative' }}>
        {/* Login form will be added later */}
      </div>
    </div>
  );
}

import DotGrid from '../../components/common/DotGrid';
import './StudentAuth.css';

export default function StudentLogin() {
  return (
    <div className="auth-page">
      {/* DotGrid Background */}
      <DotGrid
        dotSize={6}
        gap={25}
        baseColor="rgba(59, 130, 246, 0.4)"
        activeColor="rgba(59, 130, 246, 0.9)"
        proximity={140}
        className="auth-background"
      />
      
      {/* Content will go here */}
      <div className="auth-content" style={{ zIndex: 1, position: 'relative' }}>
        {/* Login form will be added later */}
      </div>
    </div>
  );
}

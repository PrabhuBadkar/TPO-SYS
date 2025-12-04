import { useSearchParams, Navigate } from 'react-router-dom';
import StudentLogin from './student/StudentLogin';
import RecruiterLogin from './recruiter/RecruiterLogin';
import TPOAdminLogin from './tpo-admin/TPOAdminLogin';

export default function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  // Default to student if no role specified
  if (!role || role === 'student') {
    return <StudentLogin />;
  }

  if (role === 'recruiter') {
    return <RecruiterLogin />;
  }

  if (role === 'tpo-admin' || role === 'admin') {
    return <TPOAdminLogin />;
  }

  // Unknown role, redirect to home
  return <Navigate to="/" replace />;
}

import { useSearchParams, Navigate } from 'react-router-dom';
import StudentRegister from './student/StudentRegister';
import RecruiterRegister from './recruiter/RecruiterRegister';

export default function Register() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');

  // Default to student if no role specified
  if (!role || role === 'student') {
    return <StudentRegister />;
  }

  if (role === 'recruiter') {
    return <RecruiterRegister />;
  }

  // Unknown role, redirect to home
  return <Navigate to="/" replace />;
}

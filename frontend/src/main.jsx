import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import ProfileCompletion from './pages/student/ProfileCompletion.jsx'
import RecruiterStatus from './pages/recruiter/RecruiterStatus.jsx'
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard.jsx'
import TPOAdminLogin from './pages/tpo-admin/TPOAdminLogin.jsx'
import TPOAdminDashboard from './pages/tpo-admin/TPOAdminDashboard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile-completion" element={<ProfileCompletion />} />
        <Route path="/recruiter/status" element={<RecruiterStatus />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/tpo-admin/login" element={<TPOAdminLogin />} />
        <Route path="/tpo-admin/dashboard" element={<TPOAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

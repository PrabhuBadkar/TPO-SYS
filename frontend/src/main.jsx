import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import StudentLogin from './pages/student/StudentLogin.jsx'
import StudentRegister from './pages/student/StudentRegister.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import TPOAdminLogin from './pages/tpo-admin/TPOAdminLogin.jsx'
import TPOAdminDashboard from './pages/tpo-admin/TPOAdminDashboard.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/tpo-admin/login" element={<TPOAdminLogin />} />
        <Route path="/tpo-admin/dashboard" element={<TPOAdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

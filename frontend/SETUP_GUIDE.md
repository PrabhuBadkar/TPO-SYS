# Frontend Setup Guide

Quick guide to get the TPO Management System frontend up and running.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React 18.2
- Vite 5.0
- React Router 6.20
- ESLint and related plugins

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (default values should work for local development):
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=TPO Management System
VITE_APP_VERSION=1.0.0
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## 📦 What's Included

### Landing Page Features
- ✅ Responsive header with navigation
- ✅ Hero section with statistics
- ✅ Role-based portal cards (4 roles)
- ✅ Features showcase (6 key features)
- ✅ About section
- ✅ Footer with contact information

### User Roles
1. **Student** - Access profile, apply for jobs, track applications
2. **Recruiter** - Post jobs, review applications, manage hiring
3. **TPO Admin** - Manage placements, approve jobs, analytics
4. **TPO Department** - Verify profiles, process applications

## 🎨 Customization

### Colors
Edit CSS variables in `src/index.css`:
```css
:root {
  --primary: #2563eb;      /* Primary blue */
  --secondary: #10b981;    /* Green */
  --accent: #f59e0b;       /* Orange */
  --dark: #1f2937;         /* Dark gray */
  --light: #f9fafb;        /* Light gray */
}
```

### Content
Edit `src/App.jsx` to modify:
- Hero text and statistics
- Role descriptions and features
- Feature cards
- About section content
- Footer information

## 🔧 Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Production
npm run build        # Build for production (output: dist/)
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

## 📱 Responsive Design

The landing page is fully responsive:
- **Mobile**: < 480px (single column layout)
- **Tablet**: 481px - 768px (2 column layout)
- **Desktop**: > 768px (full grid layout)

## 🔗 Backend Integration

The frontend is configured to connect to the backend API:
- **Backend URL**: http://localhost:5000
- **Proxy**: Vite proxy forwards `/api` requests to backend
- **Configuration**: See `vite.config.js`

Make sure the backend is running on port 5000 before starting the frontend.

## 📂 Project Structure

```
frontend/
├── public/                 # Static assets (add images, icons here)
├── src/
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application-specific styles
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles and CSS variables
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies and scripts
├── .eslintrc.cjs          # ESLint configuration
├── .env.example           # Environment variables template
└── README.md              # Documentation
```

## 🎯 Next Steps

After the landing page is running, you can:

1. **Add Authentication Pages**
   - Login page
   - Registration page
   - Password reset

2. **Create Role-Specific Dashboards**
   - Student dashboard
   - Recruiter dashboard
   - TPO Admin dashboard
   - TPO Department dashboard

3. **Implement Features**
   - Job listings
   - Application management
   - Profile management
   - Analytics and reports

4. **Add Components**
   - Navigation components
   - Form components
   - Table components
   - Modal components

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use, edit `vite.config.js`:
```js
server: {
  port: 3001,  // Change to any available port
}
```

### Backend Connection Issues
1. Ensure backend is running on port 5000
2. Check `VITE_API_URL` in `.env`
3. Verify proxy configuration in `vite.config.js`

### Dependencies Installation Failed
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)

## 💡 Tips

1. **Hot Module Replacement (HMR)** is enabled - changes will reflect instantly
2. **CSS Variables** make theming easy - change colors in one place
3. **Component Structure** - Keep components small and reusable
4. **State Management** - Consider adding Redux or Zustand for complex state

---

**Happy Coding! 🚀**

For questions or issues, contact the TPO Development Team.

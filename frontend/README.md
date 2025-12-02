# TPO Management System - Frontend

Modern, responsive frontend for the Training and Placement Office Management System built with React and Vite.

## 🚀 Features

- **Modern UI/UX** - Clean and intuitive interface
- **Responsive Design** - Works on all devices
- **Fast Performance** - Built with Vite for lightning-fast development
- **Role-Based Access** - Separate portals for Students, Recruiters, TPO Admin, and TPO Department
- **Real-time Updates** - Live notifications and updates

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - API URL
   - App configuration

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## 📦 Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── App.jsx         # Main application component
│   ├── App.css         # Application styles
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```

## 🎨 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **CSS3** - Styling with CSS variables

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Integration

The frontend connects to the backend API running on `http://localhost:5000`. The Vite proxy is configured to forward `/api` requests to the backend.

## 📱 Responsive Breakpoints

- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: > 768px

## 🎯 User Roles

### Student Portal
- View job postings
- Submit applications
- Track application status
- Upload and manage resumes

### Recruiter Portal
- Post job openings
- Review applications
- Schedule interviews
- Extend offers

### TPO Admin Portal
- Approve job postings
- Manage students and recruiters
- View analytics dashboard
- Send communications

### TPO Department Portal
- Verify student profiles
- Review applications
- Generate department reports
- Manage events

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

## 🚧 Development

This is a basic landing page. Additional features and pages will be added:

- [ ] Authentication pages (Login/Register)
- [ ] Student dashboard
- [ ] Recruiter dashboard
- [ ] TPO Admin dashboard
- [ ] TPO Department dashboard
- [ ] Job listings and details
- [ ] Application management
- [ ] Profile management
- [ ] Analytics and reports

## 📝 License

MIT License

## 👥 Team

TPO Development Team - ACER College

---

**Note**: This is the initial landing page. More features and pages will be added in future updates.

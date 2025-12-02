# TPO Management System - Backend API

A comprehensive backend API for the Training and Placement Office (TPO) Management System built with Node.js, Express, TypeScript, and Prisma ORM.

## 🚀 Features

### Core Modules
- **Authentication & Authorization**: JWT-based auth with role-based access control (RBAC)
- **Student Management**: Profile management, resume handling, document verification
- **Recruiter Management**: Organization verification, job posting, application tracking
- **TPO Admin**: Comprehensive admin dashboard, approvals, communications
- **Job Management**: Job postings, eligibility checking, application workflow
- **Notification System**: Multi-channel notifications (Email, SMS, Push)
- **Calendar Integration**: Event management, Google Calendar sync
- **Analytics & Reporting**: Placement statistics, student analytics, recruiter insights

### Security Features
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request validation with Zod
- Audit logging
- Session management
- MFA support

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database (NeonDB recommended)
- SendGrid account (for emails)
- Twilio account (for SMS, optional)
- Firebase project (for push notifications, optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - Database connection (DATABASE_URL)
   - JWT secret
   - Email service credentials
   - SMS service credentials (optional)
   - Push notification credentials (optional)

4. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

5. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
Server will start on `http://localhost:5000`

### Production Mode
```bash
npm run build
npm start
```

### Other Commands
```bash
# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Run linter
npm run lint

# Format code
npm run format

# Run tests
npm test
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding script
├── src/
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── validation.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── student/
│   │   ├── recruiter/
│   │   ├── tpo-admin*.routes.ts
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── student/
│   │   ├── recruiter/
│   │   ├── admin/
│   │   ├── tpo_dept/
│   │   └── ...
│   ├── utils/                 # Utility functions
│   ├── index.ts               # Alternative entry point
│   └── server.ts              # Main application entry
├── uploads/                   # File uploads (gitignored)
├── .env                       # Environment variables (gitignored)
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token

### Student Routes
- `GET /api/public/profile` - Get student profile
- `PUT /api/public/profile` - Update student profile
- `POST /api/public/resume` - Upload resume
- `GET /api/public/jobs` - Browse available jobs
- `POST /api/public/applications` - Apply for job
- `GET /api/public/dashboard` - Student dashboard

### Recruiter Routes
- `POST /api/public/recruiters` - Register organization
- `POST /api/public/recruiters/jobs` - Create job posting
- `GET /api/public/recruiters/applications` - View applications
- `POST /api/public/recruiters/offers` - Extend offer
- `GET /api/public/recruiters/analytics` - Recruiter analytics

### TPO Admin Routes
- `GET /api/internal/admin/students` - Manage students
- `GET /api/internal/admin/job-postings` - Manage job postings
- `GET /api/internal/admin/applications` - Manage applications
- `POST /api/internal/admin/communications` - Send communications
- `GET /api/internal/admin/calendar` - Manage calendar events

### Health Check
- `GET /health` - API health status

## 🗄️ Database Schema

The application uses a multi-schema PostgreSQL database:

- **auth**: User authentication and sessions
- **students**: Student profiles, resumes, documents
- **recruiters**: Organizations, job postings, applications
- **core**: TPO coordinators, communications, reports
- **audit**: Audit logs and approval requests

See `prisma/schema.prisma` for detailed schema definition.

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password encryption
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Zod schema validation
- **Audit Logging**: Track all critical actions

## 📊 Monitoring

The application includes built-in monitoring:
- Request duration tracking
- Error rate monitoring
- Health check endpoint
- Audit event logging

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

See `.env.example` for all required environment variables:

- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT signing
- `FRONTEND_URL`: Frontend URL for CORS
- `SENDGRID_API_KEY`: SendGrid API key
- `TWILIO_*`: Twilio credentials (optional)
- `FIREBASE_*`: Firebase credentials (optional)

## 🚢 Deployment

### Docker
```bash
docker build -t tpo-backend .
docker run -p 5000:5000 --env-file .env tpo-backend
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set environment variables
3. Run migrations: `npm run prisma:migrate`
4. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License

## 👥 Team

TPO Team - ACER

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Note**: Make sure to never commit `.env` files or sensitive credentials to version control.

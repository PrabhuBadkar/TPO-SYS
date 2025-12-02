import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import studentRoutes from './routes/student.routes'
import notificationsRoutes from './routes/notifications.routes'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ACER TPO API is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/notifications', notificationsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`\nEndpoints:`)
  console.log(`  GET  /health`)
  console.log(`  POST /api/auth/register`)
  console.log(`  POST /api/auth/login`)
  console.log(`  GET  /api/auth/me`)
  console.log(`  GET  /api/student/dashboard`)
  console.log(`  GET  /api/student/profile`)
  console.log(`  PUT  /api/student/profile\n`)
})

export default app

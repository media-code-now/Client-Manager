import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes, { initializeRefreshTokenService } from './routes/auth';
import clientRoutes from './routes/clientRoutes';
import taskRoutes from './routes/taskRoutes';
import credentialRoutes from './routes/credentialRoutes';

// Import database
import { testConnection, closeDatabase, pool } from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'CRM Auth API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/clients', clientRoutes);
app.use('/tasks', taskRoutes);
app.use('/credentials', credentialRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Initialize refresh token service
    initializeRefreshTokenService(pool);
    
    app.listen(PORT, () => {
      console.log(`🚀 CRM Auth Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
      console.log(`🔒 JWT expires in: ${process.env.JWT_EXPIRES_IN || '7d'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown - temporarily disabled for testing
// process.on('SIGTERM', async () => {
//   console.log('SIGTERM received, shutting down gracefully');
//   await closeDatabase();
//   process.exit(0);
// });

// process.on('SIGINT', async () => {
//   console.log('SIGINT received, shutting down gracefully');
//   await closeDatabase();
//   process.exit(0);
// });

// Start the server
startServer();

export default app;
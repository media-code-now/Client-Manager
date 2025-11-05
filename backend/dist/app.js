"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const credentialRoutes_1 = __importDefault(require("./routes/credentialRoutes"));
// Import database
const database_1 = require("./config/database");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security middleware
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Rate limiting
const generalLimiter = (0, express_rate_limit_1.default)({
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
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'CRM Auth API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// API routes
app.use('/auth', auth_1.default);
app.use('/clients', clientRoutes_1.default);
app.use('/tasks', taskRoutes_1.default);
app.use('/credentials', credentialRoutes_1.default);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
// Global error handler
app.use((error, req, res, next) => {
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
        await (0, database_1.testConnection)();
        app.listen(PORT, () => {
            console.log(`🚀 CRM Auth Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
            console.log(`🔒 JWT expires in: ${process.env.JWT_EXPIRES_IN || '7d'}`);
        });
    }
    catch (error) {
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
exports.default = app;
//# sourceMappingURL=app.js.map
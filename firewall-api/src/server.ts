import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import config, { validateConfig } from './config';
import { connectDB, initializeDatabase } from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import route handlers
import analysisRoutes from './routes/analysis';
import dashboardRoutes from './routes/dashboard';
import addressRoutes from './routes/address';
import healthRoutes from './routes/health';

dotenv.config();

class Server {
  public app: express.Application;
  private server: any;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.security.rateLimitWindow,
      max: config.security.rateLimitMaxRequests,
      message: {
        error: 'Too many requests, please try again later.',
        retryAfter: config.security.rateLimitWindow / 1000
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }
    this.app.use(requestLogger as any);

    // Health check endpoint (before other routes)
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });
  }

  private initializeRoutes(): void {
    // API Routes
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/analysis', analysisRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);
    this.app.use('/api/address', addressRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: '🛡️ Transaction Firewall API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/api/health',
          analysis: '/api/analysis',
          dashboard: '/api/dashboard',
          address: '/api/address'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();
      
      // Connect to database (skip in demo mode or if no DATABASE_URL)
      if (process.env.DEMO_MODE !== 'true' && process.env.DATABASE_URL) {
        try {
          await connectDB();
          await initializeDatabase();
          console.log('✅ Database connected and initialized');
        } catch (error) {
          console.warn('⚠️ Database connection failed, falling back to DEMO MODE');
          console.warn('Database error:', error instanceof Error ? error.message : String(error));
          process.env.DEMO_MODE = 'true';
        }
      } else {
        console.log('⚠️ Running in DEMO MODE - Database disabled');
      }
      
      // Start server
      this.server = this.app.listen(config.port, () => {
        console.log(`
🛡️  Transaction Firewall API Server Started
🌐 Server running on port ${config.port}
📊 Environment: ${config.nodeEnv}
🔗 Base RPC: ${config.blockchain.baseRpcUrl}
⏰ Started at: ${new Date().toISOString()}
        `);
      });

      // Graceful shutdown handling
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down server...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    // Close database connections
    try {
      const { closeDB } = await import('./config/database');
      await closeDB();
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
    
    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch(error => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
}

export default Server;

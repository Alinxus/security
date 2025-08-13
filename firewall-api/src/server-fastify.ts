import Fastify, { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

import config, { validateConfig } from './config';
import { connectDB, closeDB } from './config/prisma';

// Import route handlers
import analysisRoutes from './routes/analysis-fastify';
import dashboardRoutes from './routes/dashboard-fastify';
import addressRoutes from './routes/address-fastify';
import healthRoutes from './routes/health-fastify';

dotenv.config();

class FastifyServer {
  public app: FastifyInstance;

  constructor() {
    this.app = Fastify({
      logger: process.env.NODE_ENV !== 'test',
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'reqId',
      genReqId: () => uuidv4(),
    });

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private async initializeMiddleware(): Promise<void> {
    // CORS
    await this.app.register(require('@fastify/cors'), {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-frontend-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });

    // Security headers
    await this.app.register(require('@fastify/helmet'));

    // Rate limiting
    await this.app.register(require('@fastify/rate-limit'), {
      max: config.security.rateLimitMaxRequests,
      timeWindow: config.security.rateLimitWindow,
      errorResponseBuilder: (req, context) => ({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(context.ttl / 1000),
      }),
    });

    // Request logging
    this.app.addHook('onRequest', async (request) => {
      request.log.info(`📥 ${request.method} ${request.url} - Started`);\n    });

    this.app.addHook('onResponse', async (request, reply) => {
      const duration = reply.elapsedTime;
      const statusCode = reply.statusCode;
      const logLevel = statusCode >= 400 ? 'error' : 'info';
      const emoji = statusCode >= 400 ? '❌' : '✅';
      
      request.log[logLevel](`${emoji} ${request.method} ${request.url} - ${statusCode} - ${duration}ms`);
    });
  }

  private async initializeRoutes(): Promise<void> {
    // Health check endpoints
    this.app.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      };
    });

    // Root endpoint
    this.app.get('/', async (request, reply) => {
      return {
        message: '🛡️ Transaction Firewall API (Fastify)',
        version: '2.0.0',
        status: 'running',
        endpoints: {
          health: '/api/health',
          analysis: '/api/analysis',
          dashboard: '/api/dashboard',
          address: '/api/address',
        },
      };
    });

    // API Routes
    await this.app.register(healthRoutes, { prefix: '/api/health' });
    await this.app.register(analysisRoutes, { prefix: '/api/analysis' });
    await this.app.register(dashboardRoutes, { prefix: '/api/dashboard' });
    await this.app.register(addressRoutes, { prefix: '/api/address' });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.setErrorHandler(async (error, request, reply) => {
      request.log.error({
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      });

      let statusCode = 500;
      let message = error.message || 'Internal Server Error';

      if (error.validation) {
        statusCode = 400;
        message = 'Invalid input data';
      }

      // Don't leak sensitive information in production
      if (process.env.NODE_ENV === 'production' && statusCode === 500) {
        message = 'Something went wrong';
      }

      reply.status(statusCode).send({
        success: false,
        error: message,
        timestamp: new Date(),
      });
    });

    // 404 handler
    this.app.setNotFoundHandler(async (request, reply) => {
      reply.status(404).send({
        success: false,
        error: `Route ${request.method} ${request.url} not found`,
        message: 'The requested endpoint does not exist',
        timestamp: new Date(),
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Connect to database (skip in demo mode)
      if (process.env.DEMO_MODE !== 'true') {
        await connectDB();
      } else {
        console.log('⚠️ Running in DEMO MODE - Database disabled');
      }

      // Start server
      const address = await this.app.listen({
        port: config.port,
        host: '0.0.0.0', // Allow external connections
      });

      console.log(`
🛡️  Transaction Firewall API Server Started (Fastify)
🌐 Server running at ${address}
📊 Environment: ${config.nodeEnv}
🔗 Base RPC: ${config.blockchain.baseRpcUrl}
⏰ Started at: ${new Date().toISOString()}
      `);

      // Graceful shutdown handling
      const signals = ['SIGTERM', 'SIGINT'] as const;
      signals.forEach((signal) => {
        process.on(signal, async () => {
          console.log(`🛑 Received ${signal}, shutting down gracefully...`);
          await this.shutdown();
        });
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down server...');

    try {
      await this.app.close();
      console.log('✅ HTTP server closed');
    } catch (error) {
      console.error('❌ Error closing server:', error);
    }

    // Close database connections
    try {
      await closeDB();
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }

    process.exit(0);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new FastifyServer();
  server.start().catch((error) => {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  });
}

export default FastifyServer;

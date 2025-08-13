import express from 'express';
import { pool } from '../config/database';
import config from '../config';

const router = express.Router();

/**
 * @route GET /api/health
 * @description Basic health check
 */
router.get('/', async (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

/**
 * @route GET /api/health/detailed
 * @description Detailed health check including dependencies
 */
router.get('/detailed', async (req, res) => {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
    checks: {
      database: 'unknown',
      blockchain: 'unknown',
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  // Check database connection
  try {
    await pool.query('SELECT 1');
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  // Check blockchain connection
  try {
    const response = await fetch(config.blockchain.baseRpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    });
    
    if (response.ok) {
      health.checks.blockchain = 'healthy';
    } else {
      health.checks.blockchain = 'unhealthy';
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.blockchain = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * @route GET /api/health/readiness
 * @description Kubernetes readiness probe
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check if database is accessible
    await pool.query('SELECT 1');
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Database not accessible',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/health/liveness
 * @description Kubernetes liveness probe
 */
router.get('/liveness', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;

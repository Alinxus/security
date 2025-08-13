import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  wsPort: parseInt(process.env.WS_PORT || '3002'),

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/firewall_db',
  },

  // Blockchain configuration
  blockchain: {
    baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    baseTestnetRpcUrl: process.env.BASE_TESTNET_RPC_URL || 'https://goerli.base.org',
    alchemyApiKey: process.env.ALCHEMY_API_KEY,
    chainId: {
      base: 8453,
      baseGoerli: 84531,
    },
  },

  // External APIs
  apis: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      maxTokens: 2000,
      temperature: 0.1,
    },
    tenderly: {
      accessKey: process.env.TENDERLY_ACCESS_KEY,
      user: process.env.TENDERLY_USER,
      project: process.env.TENDERLY_PROJECT,
      baseUrl: 'https://api.tenderly.co/api/v1',
    },
    chainabase: {
      apiKey: process.env.CHAINABASE_API_KEY,
      baseUrl: 'https://api.chainabase.com/v1',
    },
  },

  // Security configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    bcryptRounds: 12,
  },

  // Risk scoring thresholds
  riskThresholds: {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90,
  },

  // Cache configuration
  cache: {
    contractInfoTtl: 24 * 60 * 60 * 1000, // 24 hours
    scamAddressTtl: 6 * 60 * 60 * 1000, // 6 hours
    analysisResultTtl: 30 * 60 * 1000, // 30 minutes
  },

  // Gamification settings
  gamification: {
    baseScore: 100,
    threatBlockedPoints: 10,
    closeCallPoints: 5,
    scamInteractionPenalty: -25,
    monthlyBonusPoints: 20,
  },

  // Analysis timeouts
  timeouts: {
    simulation: 10000, // 10 seconds
    aiAnalysis: 15000, // 15 seconds
    totalAnalysis: 30000, // 30 seconds
  },
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

// Validation function
export const validateConfig = (): void => {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'TENDERLY_ACCESS_KEY',
    'TENDERLY_USER',
    'TENDERLY_PROJECT',
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0 && isProduction) {
    console.error('❌ Missing required environment variables:', missingVars);
    process.exit(1);
  }

  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables (using demo values):', missingVars);
  }
};

export default config;

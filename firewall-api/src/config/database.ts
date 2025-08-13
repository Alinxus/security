import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const connectDB = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const closeDB = async (): Promise<void> => {
  await pool.end();
  console.log('🔌 Database connection closed');
};

// Database initialization queries
export const initQueries = [
  `CREATE TABLE IF NOT EXISTS scam_addresses (
    address VARCHAR(42) PRIMARY KEY,
    risk_level INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(255),
    tags TEXT[],
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS user_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address VARCHAR(42) NOT NULL,
    tx_hash VARCHAR(66),
    risk_score INTEGER NOT NULL,
    blocked BOOLEAN DEFAULT false,
    transaction_data JSONB NOT NULL,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS user_security_scores (
    user_address VARCHAR(42) PRIMARY KEY,
    current_score INTEGER DEFAULT 100,
    transactions_analyzed INTEGER DEFAULT 0,
    threats_blocked INTEGER DEFAULT 0,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    achievements JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS contract_info (
    address VARCHAR(42) PRIMARY KEY,
    is_contract BOOLEAN DEFAULT false,
    source_code TEXT,
    abi JSONB,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    creator VARCHAR(42),
    name VARCHAR(255),
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS risk_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pattern TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create indexes for better performance
  `CREATE INDEX IF NOT EXISTS idx_scam_addresses_risk_level ON scam_addresses(risk_level)`,
  `CREATE INDEX IF NOT EXISTS idx_user_transactions_user_address ON user_transactions(user_address)`,
  `CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON user_transactions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_contract_info_cached_at ON contract_info(cached_at)`,
];

export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing database schema...');
    
    for (const query of initQueries) {
      await pool.query(query);
    }
    
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Utility function for transactions
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

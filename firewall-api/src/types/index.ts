export interface Transaction {
  to: string;
  from: string;
  value: string;
  data: string;
  gas: string;
  gasPrice: string;
  nonce: number;
  chainId: number;
}

export interface RiskAnalysis {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warnings: Warning[];
  analysis: {
    isKnownScam: boolean;
    hasSuspiciousCode: boolean;
    hasUnlimitedApprovals: boolean;
    isNewContract: boolean;
    simulationResult: SimulationResult;
    aiAnalysis: AIAnalysis;
  };
  recommendation: 'PROCEED' | 'CAUTION' | 'BLOCK';
  userFriendlyMessage: string;
}

export interface Warning {
  type: 'SCAM_ADDRESS' | 'HONEYPOT' | 'RUGPULL' | 'PHISHING' | 'SUSPICIOUS_CODE' | 'UNLIMITED_APPROVAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details: string;
}

export interface SimulationResult {
  success: boolean;
  gasUsed: string;
  error?: string;
  stateChanges: StateChange[];
  tokenTransfers: TokenTransfer[];
  events: ContractEvent[];
}

export interface StateChange {
  address: string;
  slot: string;
  before: string;
  after: string;
}

export interface TokenTransfer {
  token: string;
  from: string;
  to: string;
  amount: string;
  symbol?: string;
  decimals?: number;
}

export interface ContractEvent {
  address: string;
  topics: string[];
  data: string;
  eventName?: string;
  decodedData?: any;
}

export interface AIAnalysis {
  contractRisk: number;
  riskFactors: string[];
  explanation: string;
  confidence: number;
  patterns: string[];
}

export interface ScamAddress {
  address: string;
  riskLevel: number;
  description: string;
  reportedAt: Date;
  source: string;
  tags: string[];
}

export interface UserTransaction {
  id: string;
  userAddress: string;
  txHash?: string;
  riskScore: number;
  blocked: boolean;
  createdAt: Date;
  transaction: Transaction;
  analysis: RiskAnalysis;
}

export interface UserSecurityScore {
  userAddress: string;
  currentScore: number;
  transactionsAnalyzed: number;
  threatsBlocked: number;
  lastActive: Date;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface ContractInfo {
  address: string;
  isContract: boolean;
  sourceCode?: string;
  abi?: any[];
  verified: boolean;
  createdAt?: Date;
  creator?: string;
  name?: string;
}

export interface RiskPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  riskScore: number;
  category: string;
}

export interface WebSocketMessage {
  type: 'RISK_ALERT' | 'ANALYSIS_COMPLETE' | 'SECURITY_UPDATE';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// External API Response Types
export interface TenderlySimulationResponse {
  simulation: {
    id: string;
    status: boolean;
    gasUsed: string;
    error?: string;
    transaction: {
      hash: string;
      block_number: number;
      transaction_index: number;
    };
    contracts: any[];
    generated_access_list: any[];
  };
}

export interface ChainabaseAddressResponse {
  address: string;
  risk_level: string;
  labels: string[];
  description: string;
  updated_at: string;
}

export interface OpenAIAnalysisRequest {
  contractCode: string;
  contractAddress: string;
  analysisType: 'security' | 'pattern' | 'risk';
}

import { Transaction } from '../types';
import config from '../config';

export interface RiskFactors {
  isKnownScam: boolean;
  hasSuspiciousCode: boolean;
  hasUnlimitedApprovals: boolean;
  isNewContract: boolean;
  simulationFailed: boolean;
  aiRiskScore: number;
  gasUsage: number;
  transaction: Transaction;
}

export class RiskScoringService {
  /**
   * Calculate risk score based on multiple factors
   */
  calculateRiskScore(factors: RiskFactors): number {
    let score = 0;

    // Known scam addresses - Critical risk
    if (factors.isKnownScam) {
      score += 90;
    }

    // Suspicious contract patterns - High risk
    if (factors.hasSuspiciousCode) {
      score += 60;
    }

    // Unlimited token approvals - High risk
    if (factors.hasUnlimitedApprovals) {
      score += 40;
    }

    // New/unverified contracts - Medium risk
    if (factors.isNewContract) {
      score += 30;
    }

    // Transaction simulation failed - High risk (potential honeypot)
    if (factors.simulationFailed) {
      score += 50;
    }

    // AI analysis risk score
    score += factors.aiRiskScore;

    // Unusual gas patterns
    const gasRiskScore = this.calculateGasRiskScore(factors.gasUsage, factors.transaction);
    score += gasRiskScore;

    // Additional transaction-specific risks
    const transactionRiskScore = this.calculateTransactionRiskScore(factors.transaction);
    score += transactionRiskScore;

    // Cap at 100
    return Math.min(score, 100);
  }

  /**
   * Calculate risk based on gas usage patterns
   */
  private calculateGasRiskScore(gasUsed: number, transaction: Transaction): number {
    let gasRiskScore = 0;

    // Extremely high gas usage might indicate complex malicious operations
    if (gasUsed > 500000) {
      gasRiskScore += 20;
    } else if (gasUsed > 200000) {
      gasRiskScore += 10;
    }

    // Unusually low gas for complex transactions
    if (transaction.data !== '0x' && transaction.data.length > 10 && gasUsed < 50000) {
      gasRiskScore += 15;
    }

    return gasRiskScore;
  }

  /**
   * Calculate risk based on transaction patterns
   */
  private calculateTransactionRiskScore(transaction: Transaction): number {
    let transactionRiskScore = 0;

    // Large value transfers to new addresses
    const valueInEth = parseInt(transaction.value) / 1e18;
    if (valueInEth > 10) {
      transactionRiskScore += 10;
    } else if (valueInEth > 100) {
      transactionRiskScore += 20;
    }

    // Complex transaction data
    if (transaction.data !== '0x' && transaction.data.length > 1000) {
      transactionRiskScore += 15;
    }

    // Check for suspicious function selectors
    if (transaction.data.length >= 10) {
      const functionSelector = transaction.data.slice(0, 10);
      const suspiciousFunctions = [
        '0xa9059cbb', // transfer
        '0x095ea7b3', // approve
        '0xa22cb465', // setApprovalForAll
      ];

      // Higher risk if these functions are called with unusual parameters
      if (suspiciousFunctions.includes(functionSelector)) {
        transactionRiskScore += 5;
      }
    }

    return transactionRiskScore;
  }

  /**
   * Get risk level string from numeric score
   */
  getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= config.riskThresholds.critical) return 'CRITICAL';
    if (score >= config.riskThresholds.high) return 'HIGH';
    if (score >= config.riskThresholds.medium) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Get recommendation based on risk score
   */
  getRecommendation(score: number): 'PROCEED' | 'CAUTION' | 'BLOCK' {
    if (score >= config.riskThresholds.critical) return 'BLOCK';
    if (score >= config.riskThresholds.medium) return 'CAUTION';
    return 'PROCEED';
  }
}

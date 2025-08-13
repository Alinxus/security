import { Transaction, RiskAnalysis, SimulationResult, AIAnalysis, Warning } from '../types';
import { SimulationService } from './SimulationService';
import { AIService } from './AIService';
import { ScamDatabaseService } from './ScamDatabaseService';
import { ContractService } from './ContractService';
import { RiskScoringService } from './RiskScoringService';
import config from '../config';

export class TransactionAnalyzer {
  private simulationService: SimulationService;
  private aiService: AIService;
  private scamDatabaseService: ScamDatabaseService;
  private contractService: ContractService;
  private riskScoringService: RiskScoringService;

  constructor() {
    this.simulationService = new SimulationService();
    this.aiService = new AIService();
    this.scamDatabaseService = new ScamDatabaseService();
    this.contractService = new ContractService();
    this.riskScoringService = new RiskScoringService();
  }

  /**
   * Main method to analyze a transaction and return risk assessment
   */
  async analyzeTransaction(transaction: Transaction): Promise<RiskAnalysis> {
    const startTime = Date.now();
    console.log(`🔍 Starting analysis for transaction to: ${transaction.to}`);

    try {
      // Run analysis components in parallel for better performance
      const [
        simulationResult,
        scamCheck,
        contractInfo,
        aiAnalysis
      ] = await Promise.allSettled([
        this.simulateTransaction(transaction),
        this.checkScamDatabase(transaction.to),
        this.contractService.getContractInfo(transaction.to),
        this.getAIAnalysis(transaction),
      ]);

      // Extract results or use defaults for failed analyses
      const simulation = simulationResult.status === 'fulfilled' 
        ? simulationResult.value 
        : this.getDefaultSimulationResult();

      const isKnownScam = scamCheck.status === 'fulfilled' 
        ? scamCheck.value.isScam 
        : false;

      const contract = contractInfo.status === 'fulfilled' 
        ? contractInfo.value 
        : null;

      const ai = aiAnalysis.status === 'fulfilled' 
        ? aiAnalysis.value 
        : this.getDefaultAIAnalysis();

      // Analyze transaction patterns
      const hasUnlimitedApprovals = this.checkUnlimitedApprovals(transaction);
      const hasSuspiciousCode = ai.riskFactors.length > 0;
      const isNewContract = contract ? this.isNewContract(contract) : false;

      // Generate warnings based on analysis
      const warnings = this.generateWarnings({
        isKnownScam,
        hasSuspiciousCode,
        hasUnlimitedApprovals,
        isNewContract,
        simulation,
        ai
      });

      // Calculate risk score
      const riskScore = this.riskScoringService.calculateRiskScore({
        isKnownScam,
        hasSuspiciousCode,
        hasUnlimitedApprovals,
        isNewContract,
        simulationFailed: !simulation.success,
        aiRiskScore: ai.contractRisk,
        gasUsage: parseInt(simulation.gasUsed || '0'),
        transaction
      });

      // Determine risk level and recommendation
      const riskLevel = this.getRiskLevel(riskScore);
      const recommendation = this.getRecommendation(riskScore, warnings);
      const userFriendlyMessage = this.generateUserFriendlyMessage(riskScore, warnings);

      const analysis: RiskAnalysis = {
        riskScore,
        riskLevel,
        warnings,
        analysis: {
          isKnownScam,
          hasSuspiciousCode,
          hasUnlimitedApprovals,
          isNewContract,
          simulationResult: simulation,
          aiAnalysis: ai
        },
        recommendation,
        userFriendlyMessage
      };

      const duration = Date.now() - startTime;
      console.log(`✅ Analysis completed in ${duration}ms - Risk Score: ${riskScore}`);

      return analysis;

    } catch (error) {
      console.error('❌ Transaction analysis failed:', error);
      
      // Return a safe default analysis on critical failure
      return this.getFailsafeAnalysis(transaction);
    }
  }

  private async simulateTransaction(transaction: Transaction): Promise<SimulationResult> {
    try {
      return await this.simulationService.simulateTransaction(transaction);
    } catch (error) {
      console.warn('⚠️ Simulation failed:', error);
      return this.getDefaultSimulationResult();
    }
  }

  private async checkScamDatabase(address: string): Promise<{ isScam: boolean; riskLevel: number }> {
    try {
      const scamInfo = await this.scamDatabaseService.checkAddress(address);
      return {
        isScam: scamInfo ? scamInfo.riskLevel > 50 : false,
        riskLevel: scamInfo?.riskLevel || 0
      };
    } catch (error) {
      console.warn('⚠️ Scam database check failed:', error);
      return { isScam: false, riskLevel: 0 };
    }
  }

  private async getAIAnalysis(transaction: Transaction): Promise<AIAnalysis> {
    try {
      // Only analyze contracts (not EOAs)
      if (transaction.data === '0x' || transaction.data.length <= 10) {
        return this.getDefaultAIAnalysis();
      }

      return await this.aiService.analyzeContract(transaction.to, transaction.data);
    } catch (error) {
      console.warn('⚠️ AI analysis failed:', error);
      return this.getDefaultAIAnalysis();
    }
  }

  private checkUnlimitedApprovals(transaction: Transaction): boolean {
    // Check for ERC20 approval with max uint256 value
    const maxUint256 = 'f'.repeat(64); // Max uint256
    
    // ERC20 approve function selector: 0x095ea7b3
    if (transaction.data.startsWith('0x095ea7b3')) {
      const amount = transaction.data.slice(74, 138); // Extract amount parameter
      return amount === maxUint256;
    }

    // Check for setApprovalForAll (ERC721/ERC1155)
    // setApprovalForAll function selector: 0xa22cb465
    if (transaction.data.startsWith('0xa22cb465')) {
      const approved = transaction.data.slice(74, 138); // Extract approved parameter
      return approved.endsWith('1'); // true value
    }

    return false;
  }

  private isNewContract(contractInfo: any): boolean {
    if (!contractInfo.createdAt) return false;
    
    const daysSinceCreation = (Date.now() - new Date(contractInfo.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < 7; // Less than 7 days old
  }

  private generateWarnings(analysisData: any): Warning[] {
    const warnings: Warning[] = [];

    if (analysisData.isKnownScam) {
      warnings.push({
        type: 'SCAM_ADDRESS',
        severity: 'CRITICAL',
        message: 'Known scam address detected',
        details: 'This address has been reported as a scam by multiple sources. Proceeding with this transaction will likely result in loss of funds.'
      });
    }

    if (!analysisData.simulation.success) {
      if (analysisData.simulation.error?.includes('revert')) {
        warnings.push({
          type: 'HONEYPOT',
          severity: 'HIGH',
          message: 'Transaction will fail',
          details: 'This transaction is likely a honeypot - it allows you to buy but prevents you from selling.'
        });
      }
    }

    if (analysisData.hasUnlimitedApprovals) {
      warnings.push({
        type: 'UNLIMITED_APPROVAL',
        severity: 'HIGH',
        message: 'Unlimited token approval detected',
        details: 'This transaction grants unlimited access to your tokens. The contract can drain your entire balance.'
      });
    }

    if (analysisData.hasSuspiciousCode && analysisData.ai.riskFactors.length > 0) {
      warnings.push({
        type: 'SUSPICIOUS_CODE',
        severity: 'MEDIUM',
        message: 'Suspicious contract patterns detected',
        details: `AI analysis found: ${analysisData.ai.riskFactors.join(', ')}`
      });
    }

    if (analysisData.isNewContract) {
      warnings.push({
        type: 'SUSPICIOUS_CODE',
        severity: 'LOW',
        message: 'New unverified contract',
        details: 'This contract was created recently and may not have been audited.'
      });
    }

    return warnings;
  }

  private getRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= config.riskThresholds.critical) return 'CRITICAL';
    if (riskScore >= config.riskThresholds.high) return 'HIGH';
    if (riskScore >= config.riskThresholds.medium) return 'MEDIUM';
    return 'LOW';
  }

  private getRecommendation(riskScore: number, warnings: Warning[]): 'PROCEED' | 'CAUTION' | 'BLOCK' {
    const hasCriticalWarnings = warnings.some(w => w.severity === 'CRITICAL');
    
    if (hasCriticalWarnings || riskScore >= config.riskThresholds.critical) {
      return 'BLOCK';
    }
    
    if (riskScore >= config.riskThresholds.medium) {
      return 'CAUTION';
    }
    
    return 'PROCEED';
  }

  private generateUserFriendlyMessage(riskScore: number, warnings: Warning[]): string {
    if (riskScore >= config.riskThresholds.critical) {
      return '🚨 CRITICAL RISK: This transaction is extremely dangerous and should be blocked.';
    }
    
    if (riskScore >= config.riskThresholds.high) {
      return '⚠️ HIGH RISK: This transaction has significant risks. Proceed with extreme caution.';
    }
    
    if (riskScore >= config.riskThresholds.medium) {
      return '⚠️ MEDIUM RISK: This transaction has some risks. Please review carefully.';
    }
    
    return '✅ LOW RISK: This transaction appears safe to proceed.';
  }

  private getDefaultSimulationResult(): SimulationResult {
    return {
      success: true,
      gasUsed: '21000',
      stateChanges: [],
      tokenTransfers: [],
      events: []
    };
  }

  private getDefaultAIAnalysis(): AIAnalysis {
    return {
      contractRisk: 0,
      riskFactors: [],
      explanation: 'AI analysis not available',
      confidence: 0,
      patterns: []
    };
  }

  private getFailsafeAnalysis(transaction: Transaction): RiskAnalysis {
    return {
      riskScore: 50,
      riskLevel: 'MEDIUM',
      warnings: [{
        type: 'SUSPICIOUS_CODE',
        severity: 'MEDIUM',
        message: 'Analysis temporarily unavailable',
        details: 'Unable to complete full security analysis. Proceed with caution.'
      }],
      analysis: {
        isKnownScam: false,
        hasSuspiciousCode: false,
        hasUnlimitedApprovals: false,
        isNewContract: false,
        simulationResult: this.getDefaultSimulationResult(),
        aiAnalysis: this.getDefaultAIAnalysis()
      },
      recommendation: 'CAUTION',
      userFriendlyMessage: '⚠️ Security analysis temporarily unavailable. Proceed with caution.'
    };
  }
}

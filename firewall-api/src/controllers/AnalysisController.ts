import { Request, Response } from 'express';
import { TransactionAnalyzer } from '../services/TransactionAnalyzer';
import { Transaction, APIResponse, RiskAnalysis } from '../types';
import { APIError } from '../middleware/errorHandler';

export class AnalysisController {
  private transactionAnalyzer: TransactionAnalyzer;

  constructor() {
    this.transactionAnalyzer = new TransactionAnalyzer();
  }

  /**
   * Analyze a single transaction
   */
  async analyzeTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transaction } = req.body;

      // Validate input
      if (!transaction) {
        throw new APIError('Transaction data is required', 400);
      }

      if (!this.isValidTransaction(transaction)) {
        throw new APIError('Invalid transaction format', 400);
      }

      console.log(`🔍 Analyzing transaction from ${transaction.from} to ${transaction.to}`);

      // Perform analysis
      const analysis = await this.transactionAnalyzer.analyzeTransaction(transaction);

      // TODO: Save analysis to database
      // await this.saveAnalysis(transaction, analysis);

      const response: APIResponse<RiskAnalysis> = {
        success: true,
        data: analysis,
        message: 'Transaction analysis completed',
        timestamp: new Date()
      };

      res.json(response);

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError('Transaction analysis failed', 500);
    }
  }

  /**
   * Simulate a transaction
   */
  async simulateTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transaction } = req.body;

      if (!transaction || !this.isValidTransaction(transaction)) {
        throw new APIError('Valid transaction data is required', 400);
      }

      // TODO: Implement simulation service
      const simulationResult = {
        success: true,
        gasUsed: '21000',
        stateChanges: [],
        tokenTransfers: [],
        events: []
      };

      const response: APIResponse<any> = {
        success: true,
        data: simulationResult,
        message: 'Transaction simulation completed',
        timestamp: new Date()
      };

      res.json(response);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError('Transaction simulation failed', 500);
    }
  }

  /**
   * Get analysis history for a user
   */
  async getAnalysisHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userAddress } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userAddress || !this.isValidAddress(userAddress)) {
        throw new APIError('Valid user address is required', 400);
      }

      // TODO: Fetch from database
      const history = {
        transactions: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };

      const response: APIResponse<any> = {
        success: true,
        data: history,
        message: 'Analysis history retrieved',
        timestamp: new Date()
      };

      res.json(response);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError('Failed to retrieve analysis history', 500);
    }
  }

  /**
   * Analyze multiple transactions in batch
   */
  async analyzeBatchTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new APIError('Array of transactions is required', 400);
      }

      if (transactions.length > 10) {
        throw new APIError('Maximum 10 transactions allowed per batch', 400);
      }

      // Validate all transactions
      for (const tx of transactions) {
        if (!this.isValidTransaction(tx)) {
          throw new APIError('All transactions must be valid', 400);
        }
      }

      console.log(`🔍 Analyzing batch of ${transactions.length} transactions`);

      // Analyze transactions in parallel
      const analyses = await Promise.all(
        transactions.map(tx => this.transactionAnalyzer.analyzeTransaction(tx))
      );

      const response: APIResponse<RiskAnalysis[]> = {
        success: true,
        data: analyses,
        message: `Batch analysis of ${transactions.length} transactions completed`,
        timestamp: new Date()
      };

      res.json(response);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError('Batch transaction analysis failed', 500);
    }
  }

  /**
   * Validate transaction format
   */
  private isValidTransaction(transaction: any): transaction is Transaction {
    return (
      transaction &&
      typeof transaction === 'object' &&
      typeof transaction.to === 'string' &&
      typeof transaction.from === 'string' &&
      typeof transaction.value === 'string' &&
      typeof transaction.data === 'string' &&
      this.isValidAddress(transaction.to) &&
      this.isValidAddress(transaction.from)
    );
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

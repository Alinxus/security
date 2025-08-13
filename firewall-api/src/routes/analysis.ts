import express from 'express';
import { AnalysisController } from '../controllers/AnalysisController';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const analysisController = new AnalysisController();

/**
 * @route POST /api/analysis/transaction
 * @description Analyze a transaction for security risks
 * @body { transaction: Transaction }
 */
router.post('/transaction', asyncHandler(async (req, res) => {
  await analysisController.analyzeTransaction(req, res);
}));

/**
 * @route POST /api/analysis/simulate
 * @description Simulate a transaction on Base fork
 * @body { transaction: Transaction }
 */
router.post('/simulate', asyncHandler(async (req, res) => {
  await analysisController.simulateTransaction(req, res);
}));

/**
 * @route GET /api/analysis/history/:userAddress
 * @description Get analysis history for a user
 * @param userAddress - Ethereum address
 */
router.get('/history/:userAddress', asyncHandler(async (req, res) => {
  await analysisController.getAnalysisHistory(req, res);
}));

/**
 * @route POST /api/analysis/batch
 * @description Analyze multiple transactions
 * @body { transactions: Transaction[] }
 */
router.post('/batch', asyncHandler(async (req, res) => {
  await analysisController.analyzeBatchTransactions(req, res);
}));

export default router;

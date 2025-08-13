import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route GET /api/dashboard/:userAddress
 * @description Get user security dashboard data
 */
router.get('/:userAddress', asyncHandler(async (req, res) => {
  // TODO: Implement dashboard controller
  res.json({
    success: true,
    message: 'Dashboard endpoint - Coming Soon',
    data: {
      userAddress: req.params.userAddress,
      securityScore: 85,
      transactionsAnalyzed: 0,
      threatsBlocked: 0,
      achievements: []
    },
    timestamp: new Date()
  });
}));

export default router;

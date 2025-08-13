import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route GET /api/address/:address/risk
 * @description Check risk level of an address
 */
router.get('/:address/risk', asyncHandler(async (req, res) => {
  // TODO: Implement address risk controller
  res.json({
    success: true,
    message: 'Address risk endpoint - Coming Soon',
    data: {
      address: req.params.address,
      riskLevel: 0,
      isKnownScam: false,
      description: null
    },
    timestamp: new Date()
  });
}));

export default router;

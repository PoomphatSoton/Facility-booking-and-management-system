const express = require('express');
const partnerMatchingController = require('../controllers/partner-matching.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.get(
  '/partners',
  authMiddleware.requireAuth,
  partnerMatchingController.getPartners
);

router.post(
  '/requests',
  authMiddleware.requireAuth,
  partnerMatchingController.createMatchRequest
);

router.get(
  '/requests/incoming',
  authMiddleware.requireAuth,
  partnerMatchingController.getIncomingRequests
);

router.patch(
  '/requests/:requestId/status',
  authMiddleware.requireAuth,
  partnerMatchingController.updateRequestStatus
);

module.exports = router;
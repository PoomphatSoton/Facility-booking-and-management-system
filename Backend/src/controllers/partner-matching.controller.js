const partnerMatchingService = require('../services/partner-matching.service');

const getPartners = async (req, res) => {
  try {
    const partners = await partnerMatchingService.getPartners({
      userId: req.user.id,
    });

    return res.status(200).json({
      message: 'partners fetched',
      data: partners,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'failed to get partners',
    });
  }
};

const createMatchRequest = async (req, res) => {
  try {
    const { receiverMemberId } = req.body;

    if (!receiverMemberId) {
      return res.status(400).json({
        message: 'receiverMemberId is required',
      });
    }

    const request = await partnerMatchingService.createMatchRequest({
      senderUserId: req.user.id,
      receiverMemberId,
    });

    return res.status(201).json({
      message: 'match request created',
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'failed to create match request',
    });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const requests = await partnerMatchingService.getIncomingRequests({
      userId: req.user.id,
    });

    return res.status(200).json({
      message: 'incoming partner requests fetched',
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'failed to get partner requests',
    });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const updated = await partnerMatchingService.updateRequestStatus({
      userId: req.user.id,
      requestId,
      status,
    });

    return res.status(200).json({
      message: 'partner request status updated',
      data: updated,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'failed to update partner request status',
    });
  }
};

module.exports = {
  getPartners,
  createMatchRequest,
  getIncomingRequests,
  updateRequestStatus,
};
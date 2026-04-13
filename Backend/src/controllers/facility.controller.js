const facilityService = require('../services/facility.service');

const getFacilityCards = async (_req, res) => {
  try {
    const cards = await facilityService.getFacilityCards();
    return res.status(200).json({
      status: 'ok',
      data: cards,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'failed to get facility cards',
      detail: error.message,
    });
  }
};

module.exports = {
  getFacilityCards,
};

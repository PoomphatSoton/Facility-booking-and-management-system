const facilityService = require('../services/facility.service');

const getFacilityCards = async (req, res) => {
  console.log('当前用户:', req.user);
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

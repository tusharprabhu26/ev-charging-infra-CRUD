const express = require('express');
const router = express.Router();
const {ChargePoint} = require('./evChargingSchema');
const {handleResponseAndError} = require('./handleResponseError');

function validateData(item) {
  if (
    typeof item.name !== 'string' ||
    !Array.isArray(item.location.coordinates)
  ) {
    throw new Error(`Invalid charge-points data`);
  }
}

async function createChargePoints(req, res, next) {
  try {
    Array.isArray(req.body) ?
      req.body.forEach(validateData) :
      validateData(req.body);
    const newChargePoints = await ChargePoint.insertMany(req.body);
    res.json(newChargePoints);
  } catch (err) {
    next(err);
  }
}

async function getChargePoints(req, res, next) {
  handleResponseAndError(
      ChargePoint.find(),
      res,
      next,
      'No charge points found',
  );
}

router.post('/charge-points', createChargePoints);
router.get('/charge-points', getChargePoints);

module.exports = router;

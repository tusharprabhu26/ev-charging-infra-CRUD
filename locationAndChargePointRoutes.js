const express = require('express');
const router = express.Router();
const {Location, ChargePoint} = require('./evChargingSchema');
const {handleResponseAndError} = require('./handleResponseError');

function validateData(item, type) {
  if (
    typeof item.name !== 'string' ||
    !Array.isArray(item.location.coordinates)
  ) {
    throw new Error(`Invalid ${type} data`);
  }
}

async function createItems(req, res, next, type, model) {
  try {
    Array.isArray(req.body) ?
      req.body.forEach((item) => validateData(item, type)) :
      validateData(req.body, type);
    const newItems = await model.insertMany(req.body);
    res.json(newItems);
  } catch (err) {
    next(err);
  }
}

async function getItems(req, res, next, type, model) {
  handleResponseAndError(model.find(), res, next, `No ${type} found`);
}

router.post('/locations', (req, res, next) =>
  createItems(req, res, next, 'locations', Location),
);
router.get('/locations', (req, res, next) =>
  getItems(req, res, next, 'locations', Location),
);

router.post('/charge-points', (req, res, next) =>
  createItems(req, res, next, 'charge-points', ChargePoint),
);
router.get('/charge-points', (req, res, next) =>
  getItems(req, res, next, 'charge-points', ChargePoint),
);

module.exports = router;

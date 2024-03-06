const express = require('express');
const router = express.Router();
const {Connector} = require('./evChargingSchema');
const {handleResponseAndError} = require('./handleResponseError');

function validateConnectorData(data) {
  const requiredFields = [
    'type',
    'wattage',
    'manufacturer',
    'availability',
    'chargePoint',
  ];

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) {
      throw new Error(`Invalid connectors data`);
    }
  }
}

async function createConnectors(req, res, next) {
  try {
    if (Array.isArray(req.body)) {
      req.body.forEach(validateConnectorData); // Validate each object in the array
    } else {
      validateConnectorData(req.body); // Validate the object
    }
    const newConnectors = await Connector.insertMany(req.body);
    res.json(newConnectors);
  } catch (err) {
    next(err);
  }
}

async function getConnectors(req, res, next) {
  handleResponseAndError(Connector.find(), res, next, 'No connectors found');
}

async function getNearbyConnectors(req, res, next) {
  const {type} = req.params;
  let {latitude, longitude, maxDistance = 5000} = req.query; // maxDistance is in meters

  // Convert latitude, longitude, and maxDistance to Number
  latitude = Number(latitude);
  longitude = Number(longitude);
  maxDistance = Number(maxDistance);

  handleResponseAndError(
      Connector.find({
        'type': type,
        'availability': true,
        'chargePoint.location': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
      }),
      res,
      next,
      'No nearby connectors found',
  );
}

router.post('/connectors', createConnectors);
router.get('/connectors', getConnectors);
router.get('/connectors/:type/nearby', getNearbyConnectors);

module.exports = router;

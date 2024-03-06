const express = require('express');
const router = express.Router();
const {Location} = require('./evChargingSchema');
const {handleResponseAndError} = require('./handleResponseError');

function validateData(item) {
  if (
    typeof item.name !== 'string' ||
    !Array.isArray(item.location.coordinates)
  ) {
    throw new Error(`Invalid locations data`);
  }
}

async function createLocations(req, res, next) {
  try {
    Array.isArray(req.body) ?
      req.body.forEach(validateData) :
      validateData(req.body);
    const newLocations = await Location.insertMany(req.body);
    res.json(newLocations);
  } catch (err) {
    next(err);
  }
}

async function getLocations(req, res, next) {
  handleResponseAndError(Location.find(), res, next, 'No locations found');
}

router.post('/locations', createLocations);
router.get('/locations', getLocations);

module.exports = router;

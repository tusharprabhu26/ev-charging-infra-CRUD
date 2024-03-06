const express = require('express');
const axios = require('axios');
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

async function getEstimatedChargingTime(connector, batteryCapacity, soc) {
  const response = await axios.post(
      `http://localhost:3001/estimate-charging-time`,
      {
        connectorPower: connector.wattage,
        batteryCapacity: Number(batteryCapacity),
        soc: Number(soc),
      },
  );
  return response.data.chargingTime;
}

async function getConnectorById(id) {
  const connector = await Connector.findById(id);
  if (!connector) {
    throw new Error('Connector not found');
  }
  return connector;
}

async function getConnectorDetails(req, res, next) {
  const {id} = req.params;
  const {batteryCapacity, soc} = req.query;
  try {
    let connector = await getConnectorById(id);
    const estimatedTime = await getEstimatedChargingTime(
        connector,
        batteryCapacity,
        soc,
    );

    connector = connector.toObject();
    connector.estimatedChargingTime = estimatedTime;

    res.json(connector);
  } catch (error) {
    next(error);
  }
}

async function addEstimatedChargingTimeToConnector(
    connector,
    batteryCapacity,
    soc,
) {
  try {
    const estimatedTime = await getEstimatedChargingTime(
        await getConnectorById(connector._id),
        batteryCapacity,
        soc,
    );
    connector = connector.toObject();
    connector.estimatedChargingTime = estimatedTime;
  } catch (error) {
    console.error(
        `Failed to get estimated charging time for connector ${connector._id}:`,
        error,
    );
    connector = connector.toObject();
    connector.estimatedChargingTime =
      'Error calculating estimated charging time';
  }
  return connector;
}

async function getNearbyConnectors(req, res, next) {
  const {type} = req.params;
  let {
    latitude,
    longitude,
    maxDistance = 5000,
    batteryCapacity,
    soc,
  } = req.query; // maxDistance is in meters

  // Convert latitude, longitude, and maxDistance to Number
  latitude = Number(latitude);
  longitude = Number(longitude);
  maxDistance = Number(maxDistance);

  try {
    const connectors = await Connector.find({
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
    });

    // Add estimated charging time to each connector
    const connectorsWithEstimatedTime = await Promise.all(
        connectors.map((connector) =>
          addEstimatedChargingTimeToConnector(connector, batteryCapacity, soc),
        ),
    );

    res.json(connectorsWithEstimatedTime);
  } catch (error) {
    next(error);
  }
}

router.post('/connectors', createConnectors);
router.get('/connectors', getConnectors);
router.get('/connectors/:type/nearby', getNearbyConnectors);
router.get('/connectors/:id', getConnectorDetails);

module.exports = router;

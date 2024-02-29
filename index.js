const express = require('express');
const {Connector, ChargePoint, Location} = require('./evChargingSchema');
const connectDB = require('./db');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Create new connectors
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
      throw new Error(`Invalid data: ${field} is missing`);
    }
  }
}

app.post('/connectors', async (req, res, next) => {
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
});

// Fetch all connectors
app.get('/connectors', async (req, res, next) => {
  try {
    const connectors = await Connector.find();
    if (connectors.length === 0) {
      throw new Error('No connectors found');
    }
    res.json(connectors);
  } catch (err) {
    next(err);
  }
});

// Fetch all charge-points
app.get('/charge-points', async (req, res, next) => {
  try {
    const chargePoints = await ChargePoint.find();
    if (chargePoints.length === 0) {
      throw new Error('No charge points found');
    }
    res.json(chargePoints);
  } catch (err) {
    next(err);
  }
});

// Create new charge-points
app.post('/charge-points', async (req, res, next) => {
  try {
    const newChargePoints = await createChargePoints(req.body);
    res.json(newChargePoints);
  } catch (err) {
    next(err);
  }
});

function validateData(item) {
  if (
    typeof item.name !== 'string' ||
    !Array.isArray(item.location.coordinates)
  ) {
    throw new Error('Invalid data');
  }
}

async function createChargePoints(body) {
  Array.isArray(body) ? body.forEach(validateData) : validateData(body);
  return await ChargePoint.insertMany(body);
}


// Fetch all locations
app.get('/locations', async (req, res, next) => {
  try {
    const locations = await Location.find();
    if (locations.length === 0) {
      throw new Error('No locations found');
    }
    res.json(locations);
  } catch (err) {
    next(err);
  }
});

// Create new locations
app.post('/locations', async (req, res, next) => {
  try {
    const newLocations = await createLocations(req.body);
    res.json(newLocations);
  } catch (err) {
    next(err);
  }
});

async function createLocations(body) {
  Array.isArray(body) ? body.forEach(validateData) : validateData(body);
  return await Location.insertMany(body);
}

// Fetch all nearby available connectors of a particular type
app.get('/connectors/:type/nearby', async (req, res, next) => {
  try {
    const {type} = req.params;
    let {latitude, longitude, maxDistance = 5000} = req.query; // maxDistance in meters

    // Convert latitude, longitude, and maxDistance to Number
    latitude = Number(latitude);
    longitude = Number(longitude);
    maxDistance = Number(maxDistance);

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
    if (connectors.length === 0) {
      throw new Error('No nearby connectors found');
    }
    res.json(connectors);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({error: err.toString()});
});

const port = 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

module.exports = app;

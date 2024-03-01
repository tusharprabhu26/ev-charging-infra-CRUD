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
      throw new Error(`Invalid data`);
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

// Function to handle response and error
async function handleResponseAndError(promise, res, next, errorMessage) {
  try {
    const data = await promise;
    if (data.length === 0) {
      throw new Error(errorMessage);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// Fetch all connectors
app.get('/connectors', (req, res, next) => {
  handleResponseAndError(Connector.find(), res, next, 'No connectors found');
});

// Fetch all charge-points
app.get('/charge-points', (req, res, next) => {
  handleResponseAndError(
      ChargePoint.find(),
      res,
      next,
      'No charge points found',
  );
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
app.get('/locations', (req, res, next) => {
  handleResponseAndError(Location.find(), res, next, 'No locations found');
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
app.get('/connectors/:type/nearby', (req, res, next) => {
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
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({error: err.toString()});
});

const port = 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

module.exports = app;

const request = require('supertest');
const {expect} = require('chai');
const app = require('../index');
const {Connector, ChargePoint, Location} = require('../evChargingSchema');

const newConnector = {
  type: 'Type1',
  wattage: 100,
  manufacturer: 'Manufacturer1',
  availability: true,
  chargePoint: {
    name: 'ChargePoint1',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Coordinates for Bengaluru
    },
  },
};

describe('Test the connectors path', function() {
  this.timeout(5000); // Set the timeout to 5000ms

  it('It should response the POST method', async () => {
    const response = await request(app).post('/connectors').send(newConnector);
    expect(response.statusCode).to.equal(200);
  });

  it('It should validate each connector in the array in POST method', async () => {
    const connectors = [
      {...newConnector, type: 'Type2'},
      {...newConnector, type: 'Type3'},
    ];
    const response = await request(app).post('/connectors').send(connectors);
    expect(response.statusCode).to.equal(200);
  });

  it('It should return an error if required fields are missing in POST method', async () => {
    const invalidConnector = {
      wattage: 100,
      manufacturer: 'Manufacturer1',
      availability: true,
      chargePoint: {
        name: 'ChargePoint1',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
        },
      },
    }; // 'type' field is missing

    const response = await request(app)
        .post('/connectors')
        .send(invalidConnector);
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal(
        'Error: Invalid data: type is missing',
    );
  });

  it('It should response the GET method', async () => {
    const response = await request(app).get('/connectors');
    expect(response.statusCode).to.equal(200);
  });

  it('It should handle errors in GET method', async () => {
    await Connector.deleteMany({}); // Delete all connectors
    const response = await request(app).get('/connectors');
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: No connectors found');
  });
});

describe('Test the charge-points path', function() {
  this.timeout(5000); // Set the timeout to 5000ms

  const newChargePoint = {
    name: 'ChargePoint1',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Coordinates for Bengaluru
    },
  };

  it('It should response the POST method', async () => {
    const response = await request(app)
        .post('/charge-points')
        .send(newChargePoint);
    expect(response.statusCode).to.equal(200);
  });

  it('It should validate each charge point in the array in POST method', async () => {
    const chargePoints = [
      {...newChargePoint, name: 'ChargePoint2'},
      {...newChargePoint, name: 'ChargePoint3'},
    ];
    const response = await request(app)
        .post('/charge-points')
        .send(chargePoints);
    expect(response.statusCode).to.equal(200);
  });

  it('It should response the GET method', async () => {
    const response = await request(app).get('/charge-points');
    expect(response.statusCode).to.equal(200);
  });

  it('It should handle validation errors in POST method', async () => {
    const invalidChargePoint = {...newChargePoint, name: 123}; // Invalid name
    const response = await request(app)
        .post('/charge-points')
        .send(invalidChargePoint);
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: Invalid data');
  });

  it('It should handle errors in GET method', async () => {
    await ChargePoint.deleteMany({}); // Delete all charge points
    const response = await request(app).get('/charge-points');
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: No charge points found');
  });
});

describe('Test the locations path', function() {
  this.timeout(5000); // Set the timeout to 5000ms

  const newLocation = {
    name: 'Location1',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Coordinates for Bengaluru
    },
  };

  it('It should response the POST method', async () => {
    const response = await request(app).post('/locations').send(newLocation);
    expect(response.statusCode).to.equal(200);
  });

  it('It should validate each location in the array in POST method', async () => {
    const locations = [
      {...newLocation, name: 'Location2'},
      {...newLocation, name: 'Location3'},
    ];
    const response = await request(app).post('/locations').send(locations);
    expect(response.statusCode).to.equal(200);
  });

  it('It should response the GET method', async () => {
    const response = await request(app).get('/locations');
    expect(response.statusCode).to.equal(200);
  });

  it('It should handle validation errors in POST method', async () => {
    const invalidLocation = {...newLocation, name: 123}; // Invalid name
    const response = await request(app)
        .post('/locations')
        .send(invalidLocation);
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: Invalid data');
  });

  it('It should handle errors in GET method', async () => {
    await Location.deleteMany({}); // Delete all locations
    const response = await request(app).get('/locations');
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: No locations found');
  });
});

describe('Test the connectors/:type/nearby path', function() {
  this.timeout(5000); // Set the timeout to 5000ms

  it('It should response the GET method', async () => {
    const type = 'Type1';
    const latitude = 12.9716; // Latitude for Bengaluru
    const longitude = 77.5946; // Longitude for Bengaluru

    // First, insert a location near the specified location
    const nearbyLocation = new Location({
      name: 'Nearby Location',
      location: {
        type: 'Point',
        coordinates: [longitude + 0.001, latitude + 0.001], // Coordinates for a nearby location
      },
    });

    await nearbyLocation.save();

    // Then, insert a charge point at the nearby location
    const nearbyChargePoint = new ChargePoint({
      name: 'Nearby ChargePoint',
      location: nearbyLocation.location,
    });

    await nearbyChargePoint.save();

    // Finally, insert a connector of the specified type at the nearby charge point
    const nearbyConnector = new Connector({
      type: type,
      wattage: 100,
      manufacturer: 'Manufacturer1',
      availability: true,
      chargePoint: {
        name: nearbyChargePoint.name,
        location: nearbyChargePoint.location,
      },
    });

    await nearbyConnector.save();

    const response = await request(app).get(
        `/connectors/${type}/nearby?latitude=${latitude}&longitude=${longitude}`,
    );
    expect(response.statusCode).to.equal(200);
    expect(response.body).to.be.an('array').that.is.not.empty;
  });

  it('It should handle errors in GET method for /connectors/:type/nearby', async () => {
    const type = 'Type1';
    const latitude = 12.9716; // Latitude for Bengaluru
    const longitude = 77.5946; // Longitude for Bengaluru

    // Delete all connectors of the specified type
    await Connector.deleteMany({type: type});

    const response = await request(app).get(
        `/connectors/${type}/nearby?latitude=${latitude}&longitude=${longitude}`,
    );
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: No nearby connectors found');
  });
});

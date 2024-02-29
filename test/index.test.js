const request = require('supertest');
const {expect} = require('chai');
const app = require('../index');
const {Connector, ChargePoint, Location} = require('../evChargingSchema');

function createNewConnector() {
  return {
    type: 'Type1',
    wattage: 100,
    manufacturer: 'ABB',
    availability: true,
    chargePoint: {
      name: 'ChargePoint1',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Coordinates for Bengaluru
      },
    },
  };
}

function createNewChargePoint() {
  return {
    name: 'ChargePoint1',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Coordinates for Bengaluru
    },
  };
}

function createNewLocation() {
  return {
    name: 'Location1',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Coordinates for Bengaluru
    },
  };
}

function createInvalidData(validData, fieldToRemove) {
  const invalidData = {...validData};
  delete invalidData[fieldToRemove];
  return invalidData;
}

async function getRequestAndCheckStatus(endpoint, expectedStatusCode) {
  const response = await request(app).get(`/${endpoint}`);
  expect(response.statusCode).to.equal(expectedStatusCode);
  return response;
}
let response;

function testEndpoint(endpoint, type, createValidData, fieldToRemove) {
  const validData = createValidData();
  const invalidData = createInvalidData(validData, fieldToRemove);

  describe(`Test the ${endpoint} path`, function() {
    this.timeout(5000); // Set the timeout to 5000ms
    it(`It should response the POST method for ${endpoint}`, async () => {
      response = await request(app).post(`/${endpoint}`).send(validData);
      expect(response.statusCode).to.equal(200);
    });

    it(`It should validate each ${type} in the array in POST method for ${endpoint}`, async () => {
      const items = [
        {...validData, name: `${type}2`},
        {...validData, name: `${type}3`},
      ];
      response = await request(app).post(`/${endpoint}`).send(items);
      expect(response.statusCode).to.equal(200);
    });

    it(`It should return error if fields are missing in POST method for ${endpoint}`, async () => {
      response = await request(app).post(`/${endpoint}`).send(invalidData);
      expect(response.statusCode).to.equal(500);
      expect(response.body.error).to.equal(`Error: Invalid data`);
    });

    it(`It should response the GET method for ${endpoint}`, async () => {
      response = await getRequestAndCheckStatus(endpoint, 200);
    });

    it(`It should handle errors in GET method for ${endpoint}`, async () => {
      await type.deleteMany({});
      response = await getRequestAndCheckStatus(endpoint, 500);
      expect(response.body.error).to.equal(
          `Error: No ${endpoint.replace('-', ' ')} found`,
      );
    });
  });
}
testEndpoint('connectors', Connector, createNewConnector, 'type');
testEndpoint('charge-points', ChargePoint, createNewChargePoint, 'name');
testEndpoint('locations', Location, createNewLocation, 'name');

async function getNearbyConnectors(type, latitude, longitude) {
  return await request(app).get(
      `/connectors/${type}/nearby?latitude=${latitude}&longitude=${longitude}`,
  );
}

async function performActionAndGetNearbyConnectors(
    action,
    type,
    latitude,
    longitude,
) {
  await action;
  return await getNearbyConnectors(type, latitude, longitude);
}

describe('Test the connectors/:type/nearby path', function() {
  this.timeout(5000); // Set the timeout to 5000ms
  it('It should response the GET method', async () => {
    const type = 'Type1';
    const latitude = 12.9716; // Latitude for Bengaluru
    const longitude = 77.5946; // Longitude for Bengaluru

    const nearbyLocation = new Location({
      name: 'Nearby Location',
      location: {
        type: 'Point',
        coordinates: [longitude + 0.001, latitude + 0.001], // Coordinates for a nearby location
      },
    });

    await nearbyLocation.save();

    const nearbyChargePoint = new ChargePoint({
      name: 'Nearby ChargePoint',
      location: nearbyLocation.location,
    });

    await nearbyChargePoint.save();

    const nearbyConnector = new Connector({
      type: type,
      wattage: 100,
      manufacturer: 'ABB',
      availability: true,
      chargePoint: {
        name: nearbyChargePoint.name,
        location: nearbyChargePoint.location,
      },
    });

    response = await performActionAndGetNearbyConnectors(
        nearbyConnector.save(),
        type,
        latitude,
        longitude,
    );
    expect(response.statusCode).to.equal(200);
    expect(response.body).to.be.an('array').that.is.not.empty;
  });

  it('It should handle errors in GET method for /connectors/:type/nearby', async () => {
    const type = 'Type1';
    const latitude = 12.9716; // Latitude for Bengaluru
    const longitude = 77.5946; // Longitude for Bengaluru

    // Delete all connectors of the specified type
    response = await performActionAndGetNearbyConnectors(
        Connector.deleteMany({type: type}),
        type,
        latitude,
        longitude,
    );
    expect(response.statusCode).to.equal(500);
    expect(response.body.error).to.equal('Error: No nearby connectors found');
  });
});

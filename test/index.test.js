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
  const getStatusResponse = await request(app).get(`/${endpoint}`);
  expect(getStatusResponse.statusCode).to.equal(expectedStatusCode);
  return getStatusResponse;
}

async function postRequestAndCheckStatus(
    endpoint,
    data,
    expectedStatusCode,
    expectedError,
) {
  const postStatusResponse = await request(app).post(`/${endpoint}`).send(data);
  expect(postStatusResponse.statusCode).to.equal(expectedStatusCode);
  if (expectedError) {
    expect(postStatusResponse.body.error).to.equal(expectedError);
  }
  return postStatusResponse;
}

async function checkResponse(response, expectedStatusCode, isArray) {
  expect(response.statusCode).to.equal(expectedStatusCode);
  if (isArray) {
    expect(response.body).to.be.an('array').that.is.not.empty;
  }
}

function testEndpoint(endpoint, type, createValidData, fieldToRemove) {
  const validData = createValidData();
  const invalidData = createInvalidData(validData, fieldToRemove);

  describe(`Test the ${endpoint} path`, function() {
    this.timeout(5000); // Set the timeout to 5000ms
    it(`It should response the POST method for ${endpoint}`, async () => {
      await postRequestAndCheckStatus(
          endpoint,
          validData,
          200,
      );
    });

    it(`It should validate each ${type} in the array in POST method for ${endpoint}`, async () => {
      const items = [
        {...validData, name: `${type}2`},
        {...validData, name: `${type}3`},
      ];
      await postRequestAndCheckStatus(
          endpoint,
          items,
          200,
      );
    });

    it(`It should return error if fields are missing in POST method for ${endpoint}`, async () => {
      await postRequestAndCheckStatus(
          endpoint,
          invalidData,
          400,
          `Error: Invalid ${endpoint} data`,
      );
    });

    it(`It should return error if any connector in array is invalid in POST method for ${endpoint}`,
        async () => {
          const validConnector = createNewConnector();
          const invalidConnector = createInvalidData(validConnector, 'type');
          const connectors = [validConnector, invalidConnector];

          await postRequestAndCheckStatus(
              endpoint,
              connectors,
              400,
              `Error: Invalid ${endpoint} data`,
          );
        });

    it(`It should response the GET method for ${endpoint}`, async () => {
      const getResponse = await getRequestAndCheckStatus(endpoint, 200);
      await checkResponse(getResponse, 200, true);
    });

    it(`It should handle errors in GET method for ${endpoint}`, async () => {
      await type.deleteMany({});
      const getErrorResponse = await getRequestAndCheckStatus(endpoint, 400);
      expect(getErrorResponse.body.error).to.equal(
          `Error: No ${endpoint} found`,
      );
    });
  });
}

async function getAndCheckNearbyConnectors(
    type,
    latitude,
    longitude,
    expectedStatusCode,
    isArray,
) {
  const nearbyConnectorsResponse = await request(app).get(
      `/connectors/${type}/nearby?latitude=${latitude}&longitude=${longitude}`,
  );
  await checkResponse(nearbyConnectorsResponse, expectedStatusCode, isArray);
  return nearbyConnectorsResponse;
}

async function performActionAndGetNearbyConnectors(
    action,
    type,
    latitude,
    longitude,
) {
  await action;
  return await getAndCheckNearbyConnectors(
      type,
      latitude,
      longitude,
      200,
      true,
  );
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

    const nearbyConnectorsResponse = await performActionAndGetNearbyConnectors(
        nearbyConnector.save(),
        type,
        latitude,
        longitude,
    );
    await checkResponse(nearbyConnectorsResponse, 200, true);
  });

  it('It should return connectors of specified type that are available and near specified location',
      async () => {
        const type = 'Type1';
        const latitude = 12.9716; // Latitude for Bengaluru
        const longitude = 77.5946; // Longitude for Bengaluru

        const nearbyConnector = new Connector(createNewConnector());
        await nearbyConnector.save();

        const nearbyConnectorsResponse = await getAndCheckNearbyConnectors(
            type,
            latitude,
            longitude,
            200,
            true,
        );
        nearbyConnectorsResponse.body.forEach((connector) => {
          expect(connector.type).to.equal(type);
          expect(connector.availability).to.equal(true);
        });
      });

  it('It should handle errors in GET method for /connectors/:type/nearby', async () => {
    const type = 'Type1';
    const latitude = 12.9716; // Latitude for Bengaluru
    const longitude = 77.5946; // Longitude for Bengaluru

    // Delete all connectors of the specified type
    await Connector.deleteMany({type: type});

    const nearbyConnectorsErrorResponse = await getAndCheckNearbyConnectors(
        type,
        latitude,
        longitude,
        400,
        false,
    );
    expect(nearbyConnectorsErrorResponse.body.error).to.equal(
        'Error: No nearby connectors found',
    );
  });
});

testEndpoint('connectors', Connector, createNewConnector, 'type');
testEndpoint('charge-points', ChargePoint, createNewChargePoint, 'name');
testEndpoint('locations', Location, createNewLocation, 'name');

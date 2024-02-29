const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');

let mongoServer;

async function connect() {
  let uri = 'mongodb://localhost:27017/charging_stations';
  if (process.env.NODE_ENV === 'development') {
    mongoServer = new MongoMemoryServer();
    uri = await mongoServer.getUri();
  }
  await mongoose.connect(uri);
}

module.exports = connect;

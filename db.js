const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');


async function connect() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

module.exports = connect;

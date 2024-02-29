const mongoose = require('mongoose');
const {Schema} = mongoose;

// Connector Schema
const ConnectorSchema = new Schema({
  type: String,
  wattage: Number,
  manufacturer: String,
  availability: Boolean,
  chargePoint: {
    name: String,
    location: {
      type: {type: String, default: 'Point'},
      coordinates: [Number],
    },
  },
});

// Charge Point Schema
const ChargePointSchema = new Schema({
  name: String,
  location: {
    type: {type: String, default: 'Point'},
    coordinates: [Number],
  },
});

// Location Schema
const LocationSchema = new Schema({
  name: String,
  location: {
    type: {type: String, default: 'Point'},
    coordinates: [Number],
  },
});

// Create 2dsphere index
ConnectorSchema.index({'chargePoint.location': '2dsphere'});
ChargePointSchema.index({location: '2dsphere'});
LocationSchema.index({location: '2dsphere'});

// Models
const Connector = mongoose.model('Connector', ConnectorSchema);
const ChargePoint = mongoose.model('ChargePoint', ChargePointSchema);
const Location = mongoose.model('Location', LocationSchema);

module.exports = {Connector, ChargePoint, Location};

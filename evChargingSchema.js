const mongoose = require('mongoose');
const {Schema} = mongoose;

const LocationSubSchema = new Schema({
  name: String,
  location: {
    type: {type: String, default: 'Point'},
    coordinates: [Number],
  },
});

LocationSubSchema.index({location: '2dsphere'});

const ConnectorSchema = new Schema({
  type: String,
  wattage: Number,
  manufacturer: String,
  availability: Boolean,
  chargePoint: LocationSubSchema,
});

const ChargePointSchema = LocationSubSchema;
const LocationSchema = LocationSubSchema;

// Models
const Connector = mongoose.model('Connector', ConnectorSchema);
const ChargePoint = mongoose.model('ChargePoint', ChargePointSchema);
const Location = mongoose.model('Location', LocationSchema);


module.exports = {Connector, ChargePoint, Location};

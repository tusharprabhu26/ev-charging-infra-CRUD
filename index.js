const express = require('express');
const connectorRoutes = require('./connectorRoutes');
const locationAndChargePointRoutes = require('./locationAndChargePointRoutes');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

app.use(connectorRoutes);
app.use(locationAndChargePointRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(400).send({error: err.toString()});
});

const port = process.env.PORT;

mongoose.connect(process.env.MONGO_URL);
app.listen(port, () => console.log(`Server is running on port ${port}`));

module.exports = app;

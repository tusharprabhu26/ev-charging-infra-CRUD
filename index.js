const express = require('express');
const connectDB = require('./databaseConnection');
const connectorRoutes = require('./connectorRoutes');
const locationAndChargePointRoutes = require('./locationAndChargePointRoutes');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

app.use(connectorRoutes);
app.use(locationAndChargePointRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(400).send({error: err.toString()});
});

const port = 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));

module.exports = app;

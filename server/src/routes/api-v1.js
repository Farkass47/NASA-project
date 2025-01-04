const express = require('express')

const planetRouter = require('../routes/planets/planets.router.js')
const launchesRouter = require('../routes/launches/launches.router.js')

const api = express.Router();

api.use('/planets', planetRouter);
api.use('/launches', launchesRouter);

module.exports = api
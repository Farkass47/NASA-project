const express = require('express');
const { httpGetAllPlanets } = require('./planets.controller.js');

const planetRouter = express.Router();

planetRouter.get('/', httpGetAllPlanets);

module.exports = planetRouter;

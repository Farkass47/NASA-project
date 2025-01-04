const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const v1Api = require('./routes/api-v1')

const app = express();

const whiteList = [
    'http://localhost:8000', 
    'http://127.0.0.1:8000', 
    'http://localhost:5000', 
    'http://127.0.0.1:5000'
];
app.use(cors({origin: 'http://localhost:8000'}));

app.use(morgan('combined'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/v1', v1Api);

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
})

module.exports = app;

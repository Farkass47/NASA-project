const request = require('supertest');
const app = require('../../app.js');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo.js');
const { loadPlanetsData } = require('../../models/planets.model.js');

describe('Launches API', () => {
    beforeAll(async ()=>{
        await mongoConnect();
        await loadPlanetsData();
    })

    afterAll(async ()=>{
        await mongoDisconnect();
    })

    describe('Test GET /v1/launches', () => {
        test('It should respond with 200 success', async () => {
            await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200);
        })
    }) 

    describe('Test POST /v1/launches', () => {
        const mockLaunchData = {
            mission: 'USS Enterprise',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
            launchDate: 'January 4, 2028',
        }
        const mockLaunchDataWithoutDate = {
            mission: 'USS Enterprise',
            rocket: 'NCC 1701-D',
            target: 'Kepler-62 f',
        }

        test('It should respond with 201 success', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(mockLaunchData)
                .expect('Content-Type', /json/)
                .expect(201)

            const requestDate = new Date(mockLaunchData.launchDate).valueOf()
            const responseDate = new Date(response.body.launchDate).valueOf()

            expect(responseDate).toBe(requestDate)
            expect(response.body).toMatchObject(mockLaunchDataWithoutDate)
            })
        
        test('It should catch missing required properties', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(mockLaunchDataWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400)

            expect(response.body).toStrictEqual({
                error: 'Missing required launch property'
            })
        })

        test('It should catch invalid dates', async() => {
            const response = await request(app)
                .post('/v1/launches')
                .send({...mockLaunchDataWithoutDate, launchDate: 'ZULU'})
                .expect('Content-Type', /json/)
                .expect(400)

            expect(response.body).toStrictEqual({
                error: 'Invalid launch date'
            })
        })
    })
})
const request = require('supertest');
const app = require('../../app.js');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo.js')


describe('Launches API', () => {
    beforeAll(async ()=>{
        await mongoConnect();
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
            mission: "M",
            rocket: "R",
            target: "T",
            launchDate: "January 4, 2028"
        }
        const mockLaunchDataWithoutDate = {
            mission: "M",
            rocket: "R",
            target: "T",
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
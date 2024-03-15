let server;
const request = require('supertest');

describe('/api/sponsors', () => {
    beforeEach(() => { server = require('../../index'); })
    afterEach(() => { server.close(); });

    describe('GET /', () => {
        it('should return all sponsors', async () => {
            const res = await request(server).get('/api/sponsors/');
            expect(res.status).toBe(200);
        })
    })

    describe('GET /count', () => {
        it('should return the number of sponsors (Companies) and sponsorships', async () => {
            const res = await request(server).get('/api/sponsors/count');
            expect(res.body).toHaveProperty('sponsorLength');
            expect(res.body).toHaveProperty('sponsorshipLength');
            expect(res.status).toBe(200);
        })
    })
})
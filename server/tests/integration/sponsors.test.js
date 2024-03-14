let server;
const request = require('supertest');
const { Sponsor } = require('../../models/sponsor');

describe('/api/sponsors', () => {
    beforeEach(() => { server = require('../../index'); })
    afterEach(() => { server.close(); });

    // describe('GET /', () => {
    //     it('should return all sponsors', async () => {
    //         // await Sponsor.collection.insertMany([
    //         //     { sponsorName: 'sponsor1', sponsorLink: 'link1' },
    //         //     { sponsorName: 'sponsor2', sponsorLink: 'link2' },
    //         // ]);

    //         const res = await request(server).get('/api/sponsors/');
    //         console.log(res.body);
    //         console.log("TESTING HERE TESTING HERE TEST TEST ")
    //         expect(res.status).toBe(200);
    //         // expect(res.body.length).toBe(2);
    //     })
    // })

    describe('GET /count', () => {
        it('should return the number of sponsors (companies) and sponsorships', async () => {
            const res = await request(server).get('/api/sponsors/count');
            console.log(res.body); // {} --> Empty object being returned. FIXME: Need to fix this
            expect(res.body).toHaveProperty('sponsorLength');
            expect(res.body).toHaveProperty('sponsorshipLength');
            expect(res.status).toBe(200);
        })
    })
})
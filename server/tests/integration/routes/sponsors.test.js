const app = require('../../../index');
const request = require('supertest');
const { Sponsor } = require('../../../models/sponsor');
const { Sponsorship } = require('../../../models/sponsorship');


describe('/api/sponsors', () => {
    afterEach(async () => {
        await Sponsor.deleteMany();
        await Sponsorship.deleteMany();
    });

    describe('GET /', () => {
        it('should return all sponsors', async () => {
            await Sponsor.collection.insertMany([
                {
                    sponsorName: "Sponsor1",
                    sponsorLink: "http://www.test-sponsor-1.com",
                    tags: ["tag1", "tag2"]
                },
                {
                    sponsorName: "Sponsor2",
                    sponsorLink: "http://www.test-sponsor-2.com",
                    tags: ["tag3", "tag4"]
                }
            ])

            const res = await request(app).get('/api/sponsors/');

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        })
    })

    //TODO: Move this test to the data.test.js file - Currently, this is causing issues 
    // when running in parallel with other integration tests, so it is here.
    describe('GET /count', () => {
        it('should return the number of Sponsors and Sponsorhips in database', async () => {
            let sponsors = await Sponsor.collection.insertMany([
                {
                    sponsorName: "Sponsor4",
                    sponsorLink: "http://www.test-sponsor-1.com",
                    tags: ["tag1", "tag2"]
                },
                {
                    sponsorName: "Sponsor5",
                    sponsorLink: "http://www.test-sponsor-2.com",
                    tags: ["tag3", "tag4"]
                },
                {
                    sponsorName: "Sponsor6",
                    sponsorLink: "http://www.test-sponsor-3.com",
                    tags: ["tag5", "tag6"]
                }
            ])

            let res = await Sponsorship.collection.insertMany([
                {
                    sponsorId: sponsors.insertedIds[0].toString(),
                    creatorName: "Test Creator 1",
                    contentLink: "http://www.test-content-1.com",
                    publishDate: "2024-03-01"
                },
                {
                    sponsorId: sponsors.insertedIds[1].toString(),
                    creatorName: "Test Creator 2",
                    contentLink: "http://www.test-content-2.com",
                    publishDate: "2020-01-01"
                }
            ])

            res = await request(app).get('/api/data/');
            expect(res.body.sponsorshipLength).toBe(2);
            expect(res.body.sponsorLength).toBe(3);
            expect(res.status).toBe(200);
        })
    })
})
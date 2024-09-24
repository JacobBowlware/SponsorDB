const request = require('supertest');
const { Sponsor } = require('../../../models/sponsor');
const { User } = require('../../../models/user');
const auth = require('../../../middleware/auth');

const base_url = 'http://localhost:3000';

describe('/api/sponsors', () => {
    // Define the happy path, and then in each test, we change
    // one parameter that clearly aligns with the name of the test.
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

            const user = new User({
                email: "testing@gmail.com",
                password: "1234",
                isSubscribed: true
            })

            const token = user.generateAuthToken();

            const res = await request(base_url).get('/api/sponsors/').set("x-auth-token", token);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
        });

        it('should return 401 if user is not logged in', async () => {
            const res = await request(base_url).get('/api/sponsors/');

            expect(res.status).toBe(401);
        });

        // TODO: Implement subcription feature
        // it('should return 403 if user is not subscribed', async () => {
        //     const token = new User().generateAuthToken();

        //     const res = await request(base_url).get('/api/sponsors/').set("x-auth-token", token);

        //     expect(res.status).toBe(403);
        // })
    })

    //TODO: Move this test to the data.test.js file - Currently, this is causing issues 
    // when running in parallel with other integration tests, so it is here.
    describe('GET /count', () => {
        it('should return the number of sponsors in the database', async () => {
            let sponsors = await Sponsor.collection.insertMany([
                {
                    sponsorName: "Sponsor4",
                    sponsorLink: "http://www.test-sponsor-1.com",
                    tags: ["tag1", "tag2"],
                    newslettersSponsored: ["newsletter1", "newsletter2"]
                },
                {
                    sponsorName: "Sponsor5",
                    sponsorLink: "http://www.test-sponsor-2.com",
                    tags: ["tag3", "tag4"],
                    newslettersSponsored: ["newsletter3", "newsletter4"]
                },
                {
                    sponsorName: "Sponsor6",
                    sponsorLink: "http://www.test-sponsor-3.com",
                    tags: ["tag5", "tag6"],
                    newslettersSponsored: ["newsletter5", "newsletter6", "newsletter7"]
                }
            ]);

            let res = await request(base_url).get('/api/data/');
            expect(res.body.sponsorLength).toBe(3);
            expect(res.status).toBe(200);
        });
    })

    describe('POST /', () => {
        it('should return 401 if user is not logged in', async () => {
            const res = await request(base_url).post('/api/sponsors/').send({ sponsorName: "Sponsor1", sponsorLink: "http://www.test-sponsor-1.com", tags: ["tag1", "tag2"] });

            expect(res.status).toBe(401);
        });

        it('should return 400 if sponsorName is invalid', async () => {
            const token = new User().generateAuthToken();
            const req = { header: jest.fn() };
            const resF = {
                status: jest.fn().mockReturnValue({
                    send: jest.fn()
                })
            };
            const next = jest.fn();

            auth(req, resF, next);
            const res = await request(base_url).post('/api/sponsors/').set("x-auth-token", token).send({ sponsorName: "", sponsorLink: "http://www.test-sponsor-1.com", tags: ["tag1", "tag2"] });

            expect(res.status).toBe(400);
        });
    })
})
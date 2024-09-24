const { PotentialSponsor } = require('../../../models/potentialSponsor');

describe('Potential Sponsor model', () => {
    it('should create a Potential Sponsor object', () => {
        const potentialSponsorData = {
            emailSender: "weekly-tech-exampleNewsletter@gmail.com",
            potentialSponsorLinks: ["http://www.example-sponsor.com", "http://www.example-sponsor2.com"]
        }

        const sponsor = new PotentialSponsor(potentialSponsorData);

        expect(sponsor).toMatchObject(potentialSponsorData);
    })
});
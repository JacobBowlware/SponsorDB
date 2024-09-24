const { Sponsor } = require('../../../models/sponsor');

describe('Sponsor model', () => {
    it('should create a Sponsor object', () => {
        const sponsorData = {
            sponsorName: 'Example Sponsor',
            sponsorLink: 'http://www.example-sponsor.com',
            tags: ['tag1', 'tag2'],
            newslettersSponsored: ['newsletter1', 'newsletter2']
        }

        const sponsor = new Sponsor(sponsorData);

        expect(sponsor).toMatchObject(sponsorData);
    })
});
const { User } = require('../../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

describe('user.generateAuthToken', () => {
    it('should return a valid JWT', () => {
        const userData = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            email: 'example@gmail.com',
            password: '1234',
            isSubscribed: true
        }
        const user = new User(userData);

        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        expect(decoded).toMatchObject({ _id: userData._id })
    })
});
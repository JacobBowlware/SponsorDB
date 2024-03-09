const auth = require('../../../middleware/auth');
const { User } = require('../../../models/user');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const config = require('config');

describe('auth middleware', () => {
    const res = {
        status: jest.fn().mockReturnValue({
            send: jest.fn()
        })
    };

    const next = jest.fn();

    it('should populate req.user with the payload of a valid JWT', () => {
        const userData = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            email: 'example@gmail.com',
            password: '1234',
            isSubscribed: true
        }

        const user = new User(userData);
        const req = {
            header: jest.fn().mockReturnValue(jwt.sign({
                _id: user._id,
                isSubscribed: user.isSubscribed,
                'email': user.email,
                'password': user.password
            }, config.get('jwtPrivateKey')))
        };
        auth(req, res, next);

        expect(req.user).toMatchObject(userData);
    });

    it('should return 400 if the JWT is invalid', () => {
        const req = {
            header: jest.fn().mockReturnValue('InvalidToken')
        };

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    })

    it('should return 401 if no token is provided', () => {
        const req = {
            header: jest.fn().mockReturnValue(null)
        };

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    })
});
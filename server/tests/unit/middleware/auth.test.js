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
    const userData = {
        _id: new mongoose.Types.ObjectId().toHexString(),
        email: 'example@gmail.com',
        password: '1234'
    }

    const user = new User(userData);

    let req = {
        header: jest.fn().mockReturnValue(jwt.sign({
            _id: user._id,
            'email': user.email,
            'password': user.password
        }, config.get('JWT_PRIVATE_KEY')))
    };

    it('should populate req.user with the payload of a valid JWT', () => {
        auth(req, res, next);

        console.log(req.user)
        expect(req.user).toMatchObject(userData);
    });

    it('should return 400 if the JWT is invalid', () => {
        req = {
            header: jest.fn().mockReturnValue('InvalidToken')
        };

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if no token is provided', () => {
        req = {
            header: jest.fn().mockReturnValue(null)
        };

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should call next if the token is valid', () => {
        auth(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
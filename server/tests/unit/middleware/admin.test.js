const admin = require('../../../middleware/admin');
const { User } = require('../../../models/user');
const mongoose = require('mongoose');

describe('admin middleware', () => {
    const res = {
        status: jest.fn().mockReturnValue({
            send: jest.fn()
        })
    };
    const next = jest.fn();

    it('should do nothing if user isAdmin', () => {
        const userData = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            email: 'example@gmail.com',
            password: '1234',
            isSubscribed: true,
            isAdmin: true
        }

        const user = new User(userData);
        const req = { user: user };

        admin(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', () => {
        const userData = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            email: 'example@gmail.com',
            password: '1234',
            isSubscribed: true,
            isAdmin: false
        }

        const user = new User(userData);
        const req = { user: user };

        admin(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
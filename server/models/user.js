const mongoose = require('mongoose');
const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100,
        unique: true
    },
    password: {
        type: String,
        required: false,
        minlength: 2,
        maxlength: 100
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: false
    },
    picture: {
        type: String,
        required: false
    },
    purchased: {
        type: Boolean,
        required: true,
        default: false
    },
    stripeCustomerId: {
        type: String,
        required: false
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    }
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_PRIVATE_KEY || config.get('JWT_PRIVATE_KEY'));
    return token;
}

const User = mongoose.model('User', userSchema);

const validateUser = (user) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100),
        googleId: Joi.string(),
        name: Joi.string(),
        picture: Joi.string(),
        purchased: Joi.boolean(),
        stripeCustomerId: Joi.string(),
        isAdmin: Joi.boolean()
    });

    return schema.validate(user);
}

module.exports.validateUser = validateUser;
module.exports.User = User;
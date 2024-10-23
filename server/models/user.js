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
        required: true,
        minlength: 2,
        maxlength: 100
    },
    isSubscribed: {
        type: Boolean,
        required: false,
        default: false
    },
    subscriptionPlan: {
        type: String,
        required: false,
        maxlength: 100
    },
    currentPeriodEnd: {
        type: Number,
        required: false
    },
    stripeCustomerId: {
        type: String,
        required: false,
        maxlength: 100
    },
    isAdmin: {
        type: Boolean,
        required: false,
        default: false
    }
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.jwtPrivateKey || config.get('jwtPrivateKey'));
    return token;
}

const User = mongoose.model('User', userSchema);

const validateUser = (user) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100).required(),
        isSubscribed: Joi.boolean(),
        subscriptionPlan: Joi.string().max(100),
        currentPeriodEnd: Joi.number(),
        stripeCustomerId: Joi.string().max(100),
        isAdmin: Joi.boolean()
    });

    return schema.validate(user);
}

module.exports.validateUser = validateUser;
module.exports.User = User;
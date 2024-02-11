const mongoose = require('mongoose');
const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    password: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    isSubscribed: {
        type: Boolean,
        required: true,
        default: false
    }
});

userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id, isSubscribed: this.isSubscribed }, config.get('jwtPrivateKey'));
    return token;
}

const User = mongoose.model('User', userSchema);

const validateUser = (user) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100).required(),
        isSubscribed: Joi.boolean().default(false),
    });

    return schema.validate(user);
}

module.exports.validateUser = validateUser;
module.exports.User = User;
const mongoose = require('mongoose');

const User = mongoose.model('User', new mongoose.Schema({
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
    },
}));

const validateUser = (user) => {
    const schema = Joi.object({
        email: Joi.string().min(2).max(100).required(),
        password: Joi.string().min(2).max(100).required(),
        isSubscribed: Joi.boolean().required()
    });

    return schema.validate(user);
}

module.exports.User = User;
module.exports.validateUser = validateUser;
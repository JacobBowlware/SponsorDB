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

module.exports.User = User;
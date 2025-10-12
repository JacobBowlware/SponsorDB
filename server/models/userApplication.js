const mongoose = require('mongoose');
const Joi = require('joi');

const userApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sponsorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    sponsorName: {
        type: String,
        required: true
    },
    contactEmail: {
        type: String,
        required: true
    },
    dateApplied: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'responded', 'follow_up_needed', 'closed_won', 'closed_lost'],
        default: 'pending'
    },
    responseDate: {
        type: Date
    },
    followUpDate: {
        type: Date
    },
    revenue: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    lastContactDate: {
        type: Date,
        default: Date.now
    }
});

const UserApplication = mongoose.model('UserApplication', userApplicationSchema);

const validateUserApplication = (application) => {
    const schema = Joi.object({
        userId: Joi.string().required(),
        sponsorId: Joi.string().required(),
        sponsorName: Joi.string().required(),
        contactEmail: Joi.string().email().required(),
        dateApplied: Joi.date(),
        status: Joi.string().valid('pending', 'responded', 'follow_up_needed', 'closed_won', 'closed_lost'),
        responseDate: Joi.date(),
        followUpDate: Joi.date(),
        revenue: Joi.number().min(0),
        notes: Joi.string().allow(''),
        lastContactDate: Joi.date()
    });
    return schema.validate(application);
};

module.exports = { UserApplication, validateUserApplication };




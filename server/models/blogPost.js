const mongoose = require('mongoose');
const slugify = require('slugify');

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        minlength: 50
    },
    summary: {
        type: String,
        required: true,
        maxlength: 300
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    published: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String
    }]
});

// Generate slug before saving
blogPostSchema.pre('save', function(next) {
    if (!this.slug) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
    }
    this.updatedAt = Date.now();
    next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

module.exports = { BlogPost }; 
const express = require('express');
const router = express.Router();
const { BlogPost } = require('../models/blogPost');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Joi = require('joi');

require('../middleware/corHeaders')(router);

// Initialize blog posts if none exist
const initializeBlogPosts = async () => {
    const count = await BlogPost.countDocuments();
    if (count === 0) {
        const initialPosts = [
            {
                title: "The Ultimate Guide to Finding Newsletter Sponsors in 2024",
                content: `Finding the right sponsors for your newsletter can feel like searching for a needle in a haystack. With thousands of potential sponsors out there, how do you identify the ones that are the perfect fit for your audience?

The traditional approach involves hours of manual research, cold outreach, and guesswork. But what if there was a better way?

Enter SponsorDB - a comprehensive database that connects newsletter creators with relevant sponsors. Instead of spending countless hours researching potential sponsors, you can instantly access a curated list of companies actively looking to sponsor newsletters like yours.

Here's what makes SponsorDB different:
• Real-time sponsor data
• Verified sponsorship opportunities
• Detailed sponsor profiles
• Easy filtering by industry and budget

Don't let valuable sponsorship opportunities slip through the cracks. Try SponsorDB today and transform your newsletter monetization strategy.`,
                summary: "Discover how to streamline your newsletter sponsorship search and connect with the right sponsors for your audience.",
                published: true,
                tags: ["Strategy", "Growth", "Tips"],
                slug: "ultimate-guide-finding-newsletter-sponsors-2024"
            },
            {
                title: "How to Price Your Newsletter Sponsorship Slots",
                content: `Pricing your newsletter sponsorship slots can be one of the most challenging aspects of monetizing your newsletter. Set the price too high, and you might scare away potential sponsors. Set it too low, and you're leaving money on the table.

The key to successful pricing lies in understanding your newsletter's value and the current market rates. But how do you gather this information?

This is where SponsorDB comes in. Our platform provides real-time data on sponsorship rates across different newsletter sizes and niches. Instead of guessing or relying on outdated information, you can make data-driven pricing decisions.

Here's what you should consider when pricing your sponsorships:
• Your subscriber count and engagement rates
• Your newsletter's niche and audience demographics
• Current market rates for similar newsletters
• The value you provide to sponsors

With SponsorDB, you can access this information instantly and set competitive prices that reflect your newsletter's true value.`,
                summary: "Learn the art of pricing your newsletter sponsorships effectively using real market data.",
                published: true,
                tags: ["Pricing", "Strategy", "Resources"],
                slug: "how-to-price-newsletter-sponsorship-slots"
            },
            {
                title: "Building a Newsletter That Attracts Premium Sponsors",
                content: `Creating a newsletter that attracts premium sponsors requires more than just great content. It's about building a brand that sponsors want to be associated with and an audience that sponsors want to reach.

But how do you know what sponsors are looking for? And how do you position your newsletter to attract the right sponsors?

This is where SponsorDB can help. Our platform not only connects you with potential sponsors but also provides insights into what sponsors are looking for in newsletter partnerships.

Key elements that attract premium sponsors:
• Consistent, high-quality content
• Engaged and growing audience
• Clear audience demographics
• Professional presentation
• Track record of successful sponsorships

With SponsorDB, you can access sponsor preferences and requirements, helping you tailor your newsletter to attract the sponsors you want.`,
                summary: "Discover the key elements that make your newsletter attractive to premium sponsors.",
                published: true,
                tags: ["Growth", "Community", "Tips"],
                slug: "building-newsletter-attracts-premium-sponsors"
            }
        ];

        for (const post of initialPosts) {
            const blogPost = new BlogPost(post);
            await blogPost.save();
        }
    }
};

// Initialize blog posts
initializeBlogPosts();

// Get all published blog posts
router.get('/', async (req, res) => {
    const posts = await BlogPost.find({ published: true })
        .select('title summary slug createdAt tags')
        .sort('-createdAt');
    res.send(posts);
});

// Get a single blog post by slug
router.get('/:slug', async (req, res) => {
    try {
        const post = await BlogPost.findOne({ 
            slug: req.params.slug,
            published: true 
        });
        
        if (!post) {
            return res.status(404).send('Blog post not found.');
        }
        res.send(post);
    } catch (error) {
        console.error('Error fetching blog post:', error);
        res.status(500).send('Error fetching blog post');
    }
});

// Create a new blog post (admin only)
router.post('/', [auth, admin], async (req, res) => {
    const { error } = validateBlogPost(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const blogPost = new BlogPost({
        title: req.body.title,
        content: req.body.content,
        summary: req.body.summary,
        published: req.body.published || false
    });

    await blogPost.save();
    res.status(201).send(blogPost);
});

// Update a blog post (admin only)
router.put('/:id', [auth, admin], async (req, res) => {
    const { error } = validateBlogPost(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const post = await BlogPost.findByIdAndUpdate(
        req.params.id,
        {
            title: req.body.title,
            content: req.body.content,
            summary: req.body.summary,
            published: req.body.published
        },
        { new: true }
    );

    if (!post) return res.status(404).send('Blog post not found.');
    res.send(post);
});

// Delete a blog post (admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).send('Blog post not found.');
    res.send(post);
});

// Get all blog posts (admin only)
router.get('/admin/all', [auth, admin], async (req, res) => {
    const posts = await BlogPost.find()
        .select('title summary slug createdAt published')
        .sort('-createdAt');
    res.send(posts);
});

function validateBlogPost(post) {
    const schema = Joi.object({
        title: Joi.string().min(5).max(200).required(),
        content: Joi.string().min(50).required(),
        summary: Joi.string().max(300).required(),
        published: Joi.boolean()
    });

    return schema.validate(post);
}

module.exports = router; 
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendarAlt, 
    faTag, 
    faLightbulb, 
    faChartLine, 
    faRocket, 
    faMoneyBillWave,
    faUsers,
    faBookmark
} from '@fortawesome/free-solid-svg-icons';

interface BlogPost {
    id: string;
    title: string;
    summary: string;
    content: string;
    date: string;
    tags: string[];
}

// Map of tag names to their corresponding icons
const tagIcons: { [key: string]: any } = {
    'Strategy': faRocket,
    'Growth': faChartLine,
    'Tips': faLightbulb,
    'Pricing': faMoneyBillWave,
    'Community': faUsers,
    'Resources': faBookmark,
    'default': faTag
};

// Blog post content
const blogPosts: { [key: string]: BlogPost } = {
    '1': {
        id: '1',
        title: 'The Ultimate Guide to Finding Newsletter Sponsors in 2025',
        summary: 'Discover how to streamline your newsletter sponsorship search and connect with the right sponsors for your audience.',
        content: `Finding the right sponsors for your newsletter can feel like searching for a needle in a haystack. With thousands of potential sponsors out there, how do you identify the ones that are the perfect fit for your audience?

The traditional approach involves hours of manual research, cold outreach, and guesswork. But what if there was a better way?

Enter SponsorDB - a comprehensive database of sponsor leads and direct application links. Instead of spending countless hours researching potential sponsors, you can instantly access a curated list of companies actively looking to sponsor newsletters like yours.

Here's what makes SponsorDB different:
• Extensive database of sponsor leads
• Direct application links to save time
• No more endless searching
• Apply to as many sponsors as you want

Don't let valuable sponsorship opportunities slip through the cracks. Try SponsorDB today and start applying to sponsors in minutes, not months.`,
        date: 'March 15, 2025',
        tags: ['Strategy', 'Growth', 'Tips']
    },
    '2': {
        id: '2',
        title: 'How to Price Your Newsletter Sponsorship Slots',
        summary: 'Master the art of pricing your newsletter sponsorships effectively.',
        content: `Pricing your newsletter sponsorship slots can be one of the most challenging aspects of monetizing your newsletter. Set the price too high, and you might scare away potential sponsors. Set it too low, and you're leaving money on the table.

The key to successful pricing lies in understanding your newsletter's value and finding sponsors that align with your pricing strategy. But how do you find the right sponsors for your price point?

This is where SponsorDB can help. Our platform provides access to a wide range of sponsors, from startups to established companies. You can browse through different sponsorship opportunities and find ones that match your newsletter's value proposition.

Here's what you should consider when pricing your sponsorships:
• Your subscriber count and engagement rates
• Your newsletter's niche and audience demographics
• The value you provide to sponsors
• Your time and content creation costs
• Your newsletter's growth potential

With SponsorDB, you can quickly find sponsors that align with your pricing strategy and start applying right away. Remember, the goal is to find sponsors who see the value in your newsletter and are willing to pay what it's worth.`,
        date: 'March 14, 2025',
        tags: ['Pricing', 'Strategy', 'Resources']
    },
    '3': {
        id: '3',
        title: 'Building a Newsletter That Attracts Premium Sponsors',
        summary: 'Learn the key elements that make your newsletter attractive to premium sponsors.',
        content: `Creating a newsletter that attracts premium sponsors requires more than just great content. It's about building a brand that sponsors want to be associated with and an audience that sponsors want to reach.

But how do you know what sponsors are looking for? And how do you position your newsletter to attract the right sponsors?

This is where SponsorDB can help. Our platform provides access to a wide range of sponsors, from startups to established companies. You can browse through different sponsorship opportunities and find ones that align with your newsletter's focus and audience.

Key elements that attract premium sponsors:
• Consistent, high-quality content
• Engaged and growing audience
• Clear audience demographics
• Professional presentation
• Track record of successful sponsorships

With SponsorDB, you can quickly find and apply to sponsors that match your newsletter's profile.`,
        date: 'March 13, 2025',
        tags: ['Growth', 'Community', 'Tips']
    },
    '4': {
        id: '4',
        title: '5 Common Newsletter Sponsorship Mistakes to Avoid',
        summary: 'Avoid the pitfalls that can derail your newsletter monetization efforts.',
        content: `When it comes to newsletter sponsorships, even experienced creators can make costly mistakes. Here are five common pitfalls to avoid:

1. Undervaluing Your Newsletter
Many creators set their sponsorship rates too low, leaving money on the table. Research similar newsletters and their sponsorship rates to understand your true market value.

2. Poor Sponsor Targeting
Spraying and praying with cold outreach rarely works. Use SponsorDB to find sponsors that are actively looking for newsletters like yours and apply directly through their application links.

3. Lack of Professional Presentation
Your sponsorship pitch needs to be as polished as your newsletter. Take the time to craft a compelling application that highlights your newsletter's value.

4. Inconsistent Communication
Keep your sponsors in the loop with regular updates. Maintain professional relationships with your sponsors through clear and timely communication.

5. Not Tracking Applications
Without tracking your applications, you can't improve your success rate. Keep a record of where you've applied and follow up appropriately.

Don't let these mistakes hold you back. Use SponsorDB to find and apply to the right sponsors for your newsletter.`,
        date: 'March 12, 2025',
        tags: ['Tips', 'Strategy', 'Growth']
    },
    '5': {
        id: '5',
        title: 'Maximizing Your Newsletter\'s Revenue Potential',
        summary: 'Unlock the full revenue potential of your newsletter.',
        content: `Your newsletter has more revenue potential than you might think. Here's how to maximize it:

1. Diversify Your Sponsorship Options
Don't limit yourself to just one type of sponsorship. Use SponsorDB to find various sponsorship opportunities, from display ads to dedicated emails.

2. Apply to Multiple Sponsors
The more applications you send, the higher your chances of success. SponsorDB makes it easy to apply to multiple sponsors quickly.

3. Optimize Your Application Strategy
Use data-driven insights to improve your application success rate. Track which applications get responses and refine your approach.

4. Target the Right Sponsors
Not all sponsors are created equal. Use SponsorDB to find sponsors that align with your audience and values.

5. Track and Improve Performance
Monitor your application success rate and make improvements. SponsorDB helps you apply to more sponsors in less time.

Ready to maximize your newsletter's revenue? Use SponsorDB to find and apply to sponsors that match your newsletter's profile.`,
        date: 'March 11, 2025',
        tags: ['Growth', 'Strategy', 'Resources']
    }
};

const BlogPost = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const post = id ? blogPosts[id] : null;

    if (!post) {
        return (
            <div className="web-page blog-post">
                <div className="blog-post-container">
                    <div className="blog-post-error">Post not found</div>
                    <button onClick={() => navigate('/blog')} className="btn btn-accent">
                        Back to Blog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="web-page blog-post">
            <div className="blog-post-container">
                <article className="blog-post-content">
                    <h1 className="blog-post-title">{post.title}</h1>
                    <div className="blog-post-meta">
                        <div className="blog-post-meta-item">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{post.date}</span>
                        </div>
                    </div>
                    <div className="blog-post-tags">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="blog-post-tag">
                                <FontAwesomeIcon icon={tagIcons[tag] || tagIcons.default} />
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="blog-post-body">
                        {post.content.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                    <div className="blog-post-cta">
                        <h3>Ready to Start Monetizing Your Newsletter?</h3>
                        <p>
                            Every sponsorship counts. Whether it's $100 or $1,000, each sponsor brings you one step closer to making your newsletter sustainable. 
                            With SponsorDB, you can find your first sponsor in minutes, not months. Stop spending hours on research and start connecting with 
                            sponsors who are actively looking for newsletters like yours.
                        </p>
                        <button onClick={() => navigate('/signup')} className="btn btn-accent">
                            Get Started with SponsorDB
                        </button>
                    </div>
                    <button onClick={() => navigate('/blog')} className="btn btn-accent">
                        ← Back to Blog
                    </button>
                </article>
            </div>
        </div>
    );
};

export default BlogPost; 
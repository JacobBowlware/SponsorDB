import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendarAlt, 
    faTag, 
    faLightbulb, 
    faChartLine, 
    faRocket, 
    faMoneyBillWave,
    faUsers,
    faBookmark,
    faClock,
    faUser,
    faArrowRight,
    faEnvelope,
    faSearch
} from '@fortawesome/free-solid-svg-icons';

interface BlogPost {
    id: string;
    title: string;
    summary: string;
    excerpt: string;
    date: string;
    author: string;
    readTime: string;
    category: string;
    tags: string[];
    featuredImage?: string;
}

// Categories for filtering
const categories = [
    "Email Templates",
    "Sponsor Research", 
    "Revenue Optimization",
    "Case Studies",
    "Industry Reports"
];

// Featured post data
const featuredPost = {
    id: 'featured',
    title: "How to Write Sponsor Emails That Get 25%+ Response Rates",
    excerpt: "AI-generated analysis of successful sponsor email patterns and strategies that can help improve your outreach response rates.",
    author: "AI Assistant",
    readTime: "8 min read",
    category: "Email Templates",
    date: "March 20, 2024",
    cta: "Read Full Guide"
};

// Map of tag names to their corresponding icons
const tagIcons: { [key: string]: any } = {
    'Strategy': faRocket,
    'Growth': faChartLine,
    'Tips': faLightbulb,
    'Pricing': faMoneyBillWave,
    'Community': faUsers,
    'Resources': faBookmark,
    'Email Templates': faEnvelope,
    'Sponsor Research': faSearch,
    'Revenue Optimization': faChartLine,
    'Case Studies': faBookmark,
    'Industry Reports': faChartLine,
    'default': faTag
};

// Mock data for development
const mockPosts: BlogPost[] = [
    {
        id: '1',
        title: 'The Ultimate Guide to Finding Newsletter Sponsors in 2024',
        summary: 'AI-generated strategies for streamlining your newsletter sponsorship search and connecting with the right sponsors.',
        excerpt: 'Discover AI-analyzed patterns and proven strategies for identifying and attracting high-value sponsors that align with your newsletter\'s audience and values. Learn how to research potential sponsors, craft compelling outreach emails, and build lasting partnerships that drive revenue for your newsletter business.',
        date: 'March 15, 2024',
        author: 'AI Assistant',
        readTime: '6 min read',
        category: 'Sponsor Research',
        tags: ['Strategy', 'Growth', 'Tips']
    },
    {
        id: '2',
        title: 'How to Price Your Newsletter Sponsorship Slots',
        summary: 'AI-generated insights on pricing your newsletter sponsorships effectively.',
        excerpt: 'Learn AI-analyzed methods for determining your newsletter\'s true value and setting competitive rates that attract premium sponsors. This comprehensive guide covers pricing models, market research techniques, and negotiation strategies to maximize your newsletter\'s revenue potential.',
        date: 'March 14, 2024',
        author: 'AI Assistant',
        readTime: '5 min read',
        category: 'Revenue Optimization',
        tags: ['Pricing', 'Strategy', 'Resources']
    },
    {
        id: '3',
        title: 'Building a Newsletter That Attracts Premium Sponsors',
        summary: 'AI-generated analysis of key elements that make newsletters attractive to premium sponsors.',
        excerpt: 'From content strategy to audience engagement, discover AI-identified patterns for building a sponsor-worthy newsletter. Learn about subscriber quality metrics, content optimization techniques, and audience development strategies that make your newsletter irresistible to high-value sponsors.',
        date: 'March 13, 2024',
        author: 'AI Assistant',
        readTime: '7 min read',
        category: 'Case Studies',
        tags: ['Growth', 'Community', 'Tips']
    },
    {
        id: '4',
        title: '5 Common Newsletter Sponsorship Mistakes to Avoid',
        summary: 'AI-generated analysis of common pitfalls that can derail newsletter monetization efforts.',
        excerpt: 'Learn from AI-identified common mistakes and implement best practices for successful sponsor relationships. This guide covers pricing errors, communication failures, and strategic missteps that can cost you valuable partnerships and revenue opportunities.',
        date: 'March 12, 2024',
        author: 'AI Assistant',
        readTime: '4 min read',
        category: 'Industry Reports',
        tags: ['Tips', 'Strategy', 'Growth']
    },
    {
        id: '5',
        title: 'Maximizing Your Newsletter\'s Revenue Potential',
        summary: 'AI-generated strategies for unlocking your newsletter\'s full revenue potential.',
        excerpt: 'Learn AI-analyzed advanced strategies for optimizing your sponsorship opportunities and building long-term sponsor relationships. Discover how to create multiple revenue streams, implement tiered pricing, and develop recurring partnerships that scale with your audience growth.',
        date: 'March 11, 2024',
        author: 'AI Assistant',
        readTime: '9 min read',
        category: 'Revenue Optimization',
        tags: ['Growth', 'Strategy', 'Resources']
    },
    {
        id: '6',
        title: 'How to Pitch Your Newsletter to Sponsors',
        summary: 'AI-generated templates and strategies for crafting the perfect sponsor pitch.',
        excerpt: 'Learn AI-analyzed insights on what sponsors are looking for and how to present your newsletter effectively. This comprehensive guide includes email templates, pitch deck structures, and follow-up strategies that increase your chances of landing premium sponsorships.',
        date: 'March 10, 2024',
        author: 'AI Assistant',
        readTime: '5 min read',
        category: 'Email Templates',
        tags: ['Tips', 'Strategy']
    },
    {
        id: '7',
        title: 'Newsletter Growth Hacks for 2024',
        summary: 'AI-generated growth strategies for boosting your subscriber count.',
        excerpt: 'Discover AI-analyzed tailored strategies for newsletter creators looking to scale their audience. Learn about viral growth techniques, content optimization strategies, and community building methods that help you reach your subscriber goals faster.',
        date: 'March 9, 2024',
        author: 'AI Assistant',
        readTime: '6 min read',
        category: 'Case Studies',
        tags: ['Growth', 'Tips']
    }
];

const Blog = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

    const filteredPosts = selectedCategory === 'All' 
        ? mockPosts 
        : mockPosts.filter(post => post.category === selectedCategory);

    return (
        <div className="blog-page">
            {/* Featured Post Hero */}
            <div className="blog-hero">
                <div className="blog-hero__content">
                    <div className="blog-hero__category">
                        <FontAwesomeIcon icon={tagIcons[featuredPost.category] || tagIcons.default} />
                        {featuredPost.category}
                    </div>
                    <h1 className="blog-hero__title">{featuredPost.title}</h1>
                    <p className="blog-hero__excerpt">{featuredPost.excerpt}</p>
                    <div className="blog-hero__meta">
                        <div className="blog-hero__meta-item">
                            <FontAwesomeIcon icon={faUser} />
                            <span>{featuredPost.author}</span>
                        </div>
                        <div className="blog-hero__meta-item">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>{featuredPost.date}</span>
                        </div>
                        <div className="blog-hero__meta-item">
                            <FontAwesomeIcon icon={faClock} />
                            <span>{featuredPost.readTime}</span>
                        </div>
                    </div>
                    <button 
                        className="blog-hero__cta"
                        onClick={() => navigate(`/blog/${featuredPost.id}`)}
                    >
                        {featuredPost.cta}
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                </div>
            </div>

            {/* Categories Filter */}
            <div className="blog-categories">
                <div className="blog-categories__container">
                    <button 
                        className={`blog-category ${selectedCategory === 'All' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('All')}
                    >
                        All Posts
                    </button>
                    {categories.map((category) => (
                        <button 
                            key={category}
                            className={`blog-category ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            <FontAwesomeIcon icon={tagIcons[category] || tagIcons.default} />
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="blog-content">
                <div className="blog-grid">
                    {filteredPosts.map((post) => (
                        <div 
                            key={post.id} 
                            className="blog-card"
                            onClick={() => navigate(`/blog/${post.id}`)}
                        >
                            <div className="blog-card__image">
                                <div className="blog-card__category-tag">
                                    <FontAwesomeIcon icon={tagIcons[post.category] || tagIcons.default} />
                                    {post.category}
                                </div>
                            </div>
                            <div className="blog-card__content">
                                <h2 className="blog-card__title">{post.title}</h2>
                                <p className="blog-card__excerpt">{post.excerpt}</p>
                                <div className="blog-card__meta">
                                    <div className="blog-card__author">
                                        <FontAwesomeIcon icon={faUser} />
                                        <span>{post.author}</span>
                                    </div>
                                    <div className="blog-card__date">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        <span>{post.date}</span>
                                    </div>
                                    <div className="blog-card__read-time">
                                        <FontAwesomeIcon icon={faClock} />
                                        <span>{post.readTime}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Blog; 
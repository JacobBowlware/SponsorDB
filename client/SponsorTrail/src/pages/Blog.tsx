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
    faBookmark
} from '@fortawesome/free-solid-svg-icons';

interface BlogPost {
    id: string;
    title: string;
    summary: string;
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

// Mock data for development
const mockPosts: BlogPost[] = [
    {
        id: '1',
        title: 'The Ultimate Guide to Finding Newsletter Sponsors in 2024',
        summary: 'Discover how to streamline your newsletter sponsorship search and connect with the right sponsors for your audience. Learn proven strategies for identifying and attracting high-value sponsors.',
        date: 'March 15, 2024',
        tags: ['Strategy', 'Growth', 'Tips']
    },
    {
        id: '2',
        title: 'How to Price Your Newsletter Sponsorship Slots',
        summary: 'Master the art of pricing your newsletter sponsorships effectively. Learn how to determine your newsletter\'s true value and set competitive rates that attract premium sponsors.',
        date: 'March 14, 2024',
        tags: ['Pricing', 'Strategy', 'Resources']
    },
    {
        id: '3',
        title: 'Building a Newsletter That Attracts Premium Sponsors',
        summary: 'Learn the key elements that make your newsletter attractive to premium sponsors. From content strategy to audience engagement, discover how to build a sponsor-worthy newsletter.',
        date: 'March 13, 2024',
        tags: ['Growth', 'Community', 'Tips']
    },
    {
        id: '4',
        title: '5 Common Newsletter Sponsorship Mistakes to Avoid',
        summary: 'Avoid the pitfalls that can derail your newsletter monetization efforts. Learn from common mistakes and implement best practices for successful sponsor relationships.',
        date: 'March 12, 2024',
        tags: ['Tips', 'Strategy', 'Growth']
    },
    {
        id: '5',
        title: 'Maximizing Your Newsletter\'s Revenue Potential',
        summary: 'Unlock the full revenue potential of your newsletter. Learn advanced strategies for optimizing your sponsorship opportunities and building long-term sponsor relationships.',
        date: 'March 11, 2024',
        tags: ['Growth', 'Strategy', 'Resources']
    },
    // Additional posts for variety
    {
        id: '6',
        title: 'How to Pitch Your Newsletter to Sponsors',
        summary: 'Craft the perfect pitch to land more sponsors. Learn what sponsors are looking for and how to present your newsletter effectively.',
        date: 'March 10, 2024',
        tags: ['Tips', 'Strategy']
    },
    {
        id: '7',
        title: 'Newsletter Growth Hacks for 2024',
        summary: 'Boost your subscriber count with these proven growth hacks tailored for newsletter creators.',
        date: 'March 9, 2024',
        tags: ['Growth', 'Tips']
    }
];

const Blog = () => {
    const navigate = useNavigate();

    return (
        <div className="blog-page">
            <div className="blog-header">
                <h1>SponsorDB Insights</h1>
                <p>Tips for newsletter owners looking to grow their sponsorship revenue</p>
            </div>

            <div className="blog-content">
                <div className="blog-grid">
                    {mockPosts.map((post) => (
                        <div 
                            key={post.id} 
                            className="blog-card"
                            onClick={() => navigate(`/blog/${post.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="blog-card__content">
                                <h2 className="blog-card__title">{post.title}</h2>
                                <p className="blog-card__summary">{post.summary}</p>
                                <div className="blog-card__meta">
                                    <div className="blog-card__meta-item">
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        <span>{post.date}</span>
                                    </div>
                                </div>
                                <div className="blog-card__tags">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="blog-card__tag">
                                            <FontAwesomeIcon icon={tagIcons[tag] || tagIcons.default} />
                                            {tag}
                                        </span>
                                    ))}
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
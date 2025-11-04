/**
 * Sponsor Matching Utility
 * Matches sponsors to users based on newsletter info and sponsor tags
 */

/**
 * Normalize strings for comparison (lowercase, remove special chars, handle variations)
 */
const normalizeTag = (tag) => {
    if (!tag) return '';
    return tag.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/ecommerce/g, 'ecommerce')
        .replace(/ecommerce/g, 'ecommerce')
        .replace(/aiml/g, 'ai')
        .replace(/ai\/ml/g, 'ai')
        .replace(/ai ml/g, 'ai');
};

/**
 * Check if two tags match (handles variations)
 */
const tagsMatch = (tag1, tag2) => {
    const normalized1 = normalizeTag(tag1);
    const normalized2 = normalizeTag(tag2);
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // Check if one contains the other (handles "Technology" vs "Tech")
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        // Only match if both are substantial (at least 3 chars)
        if (normalized1.length >= 3 && normalized2.length >= 3) {
            return true;
        }
    }
    
    // Specific mappings for common variations
    const mappings = {
        'ecommerce': ['ecommerce', 'e-commerce', 'retail'],
        'technology': ['tech', 'software', 'saas'],
        'finance': ['fintech', 'financial', 'crypto', 'cryptocurrency'],
        'health': ['healthcare', 'wellness', 'fitness', 'mentalhealth'],
        'education': ['learning', 'training', 'course'],
        'marketing': ['advertising', 'promotion', 'growth'],
        'business': ['enterprise', 'corporate', 'b2b'],
        'entertainment': ['gaming', 'music', 'media'],
        'lifestyle': ['lifestyle', 'life', 'personal'],
        'productivity': ['productivity', 'efficiency', 'tools'],
        'ai': ['ai', 'artificialintelligence', 'machinelearning', 'ml'],
        'saas': ['saas', 'software', 'technology'],
        'design': ['design', 'creative', 'ui', 'ux'],
        'development': ['development', 'dev', 'programming', 'coding'],
        'crypto': ['crypto', 'cryptocurrency', 'blockchain', 'finance'],
        'sales': ['sales', 'business', 'marketing'],
        'food': ['food', 'restaurant', 'culinary', 'cooking'],
        'fashion': ['fashion', 'style', 'apparel', 'clothing'],
        'travel': ['travel', 'tourism', 'vacation', 'trip'],
        'gaming': ['gaming', 'games', 'entertainment', 'esports']
    };
    
    // Check mappings
    for (const [key, variations] of Object.entries(mappings)) {
        if (variations.includes(normalized1) && variations.includes(normalized2)) {
            return true;
        }
        if (normalized1 === key && variations.includes(normalized2)) {
            return true;
        }
        if (normalized2 === key && variations.includes(normalized1)) {
            return true;
        }
    }
    
    return false;
};

/**
 * Calculate match score between a sponsor and user
 * @param {Object} sponsor - Sponsor object with tags array
 * @param {Object} userNewsletterInfo - User's newsletterInfo object
 * @returns {number} Match score from 0-100
 */
const calculateMatchScore = (sponsor, userNewsletterInfo) => {
    if (!sponsor.tags || sponsor.tags.length === 0) {
        return 0;
    }
    
    if (!userNewsletterInfo) {
        return 0;
    }
    
    let score = 0;
    const maxScore = 100;
    
    // Extract user data
    const userTopic = userNewsletterInfo.topic || '';
    const userInterests = userNewsletterInfo.audience_demographics?.interests || [];
    const idealCategories = userNewsletterInfo.sponsor_match_profile?.ideal_sponsor_categories || [];
    
    // Combine all user matching criteria
    const userMatchCriteria = [
        userTopic,
        ...userInterests,
        ...idealCategories
    ].filter(Boolean);
    
    if (userMatchCriteria.length === 0) {
        return 0;
    }
    
    // Check each sponsor tag against user criteria
    const matchedTags = [];
    sponsor.tags.forEach(sponsorTag => {
        userMatchCriteria.forEach(userCriterion => {
            if (tagsMatch(sponsorTag, userCriterion)) {
                if (!matchedTags.includes(sponsorTag)) {
                    matchedTags.push(sponsorTag);
                }
            }
        });
    });
    
    if (matchedTags.length === 0) {
        return 0;
    }
    
    // Calculate score based on:
    // - Number of matching tags (more matches = higher score)
    // - Topic match gets bonus points
    const baseScorePerMatch = 15; // Base points per matching tag
    const topicMatchBonus = userTopic && matchedTags.some(tag => tagsMatch(tag, userTopic)) ? 20 : 0;
    
    score = Math.min(
        maxScore,
        (matchedTags.length * baseScorePerMatch) + topicMatchBonus
    );
    
    // Normalize to 0-100 range
    return Math.round(score);
};

/**
 * Get matched sponsors for a user
 * @param {Array} sponsors - Array of sponsor objects
 * @param {Object} userNewsletterInfo - User's newsletterInfo object
 * @param {Object} options - Options (limit, minScore)
 * @returns {Array} Array of sponsors with match scores, sorted by score
 */
const getMatchedSponsors = (sponsors, userNewsletterInfo, options = {}) => {
    const {
        limit = 20,
        minScore = 10
    } = options;
    
    if (!userNewsletterInfo || !userNewsletterInfo.topic) {
        return [];
    }
    
    // Calculate match scores for all sponsors
    const sponsorsWithScores = sponsors.map(sponsor => {
        const matchScore = calculateMatchScore(sponsor, userNewsletterInfo);
        return {
            ...sponsor.toObject ? sponsor.toObject() : sponsor,
            matchScore,
            matchedTags: sponsor.tags ? sponsor.tags.filter(tag => {
                const userTopic = userNewsletterInfo.topic || '';
                const userInterests = userNewsletterInfo.audience_demographics?.interests || [];
                const idealCategories = userNewsletterInfo.sponsor_match_profile?.ideal_sponsor_categories || [];
                const allCriteria = [userTopic, ...userInterests, ...idealCategories].filter(Boolean);
                return allCriteria.some(criterion => tagsMatch(tag, criterion));
            }) : []
        };
    })
    .filter(sponsor => sponsor.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
    
    return sponsorsWithScores;
};

module.exports = {
    calculateMatchScore,
    getMatchedSponsors,
    tagsMatch,
    normalizeTag
};


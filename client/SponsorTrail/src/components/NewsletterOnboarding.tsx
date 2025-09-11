import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faCheck, faRocket, faUsers, faDollarSign, faEnvelope } from '@fortawesome/free-solid-svg-icons';

interface NewsletterInfo {
    // Basic Info
    name: string;
    topic: string;
    audience_size: number;
    engagement_rate: number;
    publishing_frequency: string;
    
    // Demographics
    audience_demographics: {
        age_range: string;
        income_range: string;
        location: string;
        interests: string[];
        job_titles: string[];
    };
    
    // Experience & Preferences  
    sponsorship_history: {
        previous_sponsors: string[];
        typical_rates: {
            newsletter_mention: number;
            dedicated_email: number;
            banner_ad: number;
        };
    };
    
    outreach_preferences: {
        style: string;
        follow_up_frequency: string;
        minimum_deal_size: number;
    };
}

// Helper type for nested object access
type NestedKeyOf<T> = {
    [K in keyof T]: T[K] extends object ? `${K & string}.${NestedKeyOf<T[K]> & string}` : K & string;
}[keyof T];

interface NewsletterOnboardingProps {
    onComplete: (newsletterInfo: NewsletterInfo) => void;
    onSkip: () => void;
}

const NewsletterOnboarding: React.FC<NewsletterOnboardingProps> = ({ onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [newsletterInfo, setNewsletterInfo] = useState<NewsletterInfo>({
        name: '',
        topic: '',
        audience_size: 0,
        engagement_rate: 0,
        publishing_frequency: '',
        audience_demographics: {
            age_range: '',
            income_range: '',
            location: '',
            interests: [],
            job_titles: []
        },
        sponsorship_history: {
            previous_sponsors: [],
            typical_rates: {
                newsletter_mention: 0,
                dedicated_email: 0,
                banner_ad: 0
            }
        },
        outreach_preferences: {
            style: '',
            follow_up_frequency: '',
            minimum_deal_size: 0
        }
    });

    const topics = ['Technology', 'Finance', 'Marketing', 'Lifestyle', 'Health', 'Education', 'Business', 'Entertainment', 'Sports', 'Other'];
    const interests = ['SaaS', 'E-commerce', 'Crypto', 'AI/ML', 'Design', 'Development', 'Marketing', 'Sales', 'Productivity', 'Health', 'Fitness', 'Travel', 'Food', 'Fashion', 'Gaming'];
    const jobTitles = ['Developer', 'Marketer', 'Founder', 'Designer', 'Manager', 'Analyst', 'Consultant', 'Student', 'Freelancer', 'Other'];

    const handleInputChange = (field: string, value: any) => {
        setNewsletterInfo(prev => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                const parentValue = prev[parent as keyof NewsletterInfo] as any;
                return {
                    ...prev,
                    [parent]: {
                        ...parentValue,
                        [child]: value
                    }
                };
            } else {
                return {
                    ...prev,
                    [field]: value
                };
            }
        });
    };

    const handleArrayToggle = (field: string, value: string) => {
        setNewsletterInfo(prev => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                const parentObj = prev[parent as keyof NewsletterInfo] as any;
                const currentArray = parentObj[child] || [];
                const newArray = currentArray.includes(value)
                    ? currentArray.filter((item: string) => item !== value)
                    : [...currentArray, value];
                
                return {
                    ...prev,
                    [parent]: {
                        ...parentObj,
                        [child]: newArray
                    }
                };
            } else {
                // Handle top-level array fields
                if (field === 'previous_sponsors') {
                    const currentArray = prev.sponsorship_history.previous_sponsors || [];
                    const newArray = currentArray.includes(value)
                        ? currentArray.filter(item => item !== value)
                        : [...currentArray, value];
                    
                    return {
                        ...prev,
                        sponsorship_history: {
                            ...prev.sponsorship_history,
                            previous_sponsors: newArray
                        }
                    };
                }
                
                // Default case - should not happen with current fields
                return prev;
            }
        });
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete(newsletterInfo);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep1 = () => (
        <div className="onboarding-step">
            <div className="onboarding-header">
                <FontAwesomeIcon icon={faRocket} className="onboarding-icon" />
                <h2>Tell us about your newsletter</h2>
                <p>Help us match you with the perfect sponsors</p>
            </div>
            
            <div className="onboarding-form">
                <div className="form-group full-width">
                    <label>Newsletter Name *</label>
                    <input
                        type="text"
                        value={newsletterInfo.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Tech Weekly"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Primary Topic *</label>
                    <select
                        value={newsletterInfo.topic}
                        onChange={(e) => handleInputChange('topic', e.target.value)}
                        required
                    >
                        <option value="">Select a topic</option>
                        {topics.map(topic => (
                            <option key={topic} value={topic}>{topic}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Audience Size *</label>
                    <select
                        value={newsletterInfo.audience_size}
                        onChange={(e) => handleInputChange('audience_size', parseInt(e.target.value))}
                        required
                    >
                        <option value={0}>Select audience size</option>
                        <option value={100}>Less than 1K</option>
                        <option value={1000}>1K - 5K</option>
                        <option value={5000}>5K - 25K</option>
                        <option value={25000}>25K+</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Engagement Rate (%) *</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={newsletterInfo.engagement_rate || ''}
                        onChange={(e) => handleInputChange('engagement_rate', parseInt(e.target.value) || 0)}
                        placeholder="e.g., 25"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Publishing Frequency *</label>
                    <select
                        value={newsletterInfo.publishing_frequency}
                        onChange={(e) => handleInputChange('publishing_frequency', e.target.value)}
                        required
                    >
                        <option value="">Select frequency</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="onboarding-step">
            <div className="onboarding-header">
                <FontAwesomeIcon icon={faUsers} className="onboarding-icon" />
                <h2>Who is your audience?</h2>
                <p>This helps us match you with relevant sponsors</p>
            </div>
            
            <div className="onboarding-form">
                <div className="form-group">
                    <label>Primary Age Range *</label>
                    <select
                        value={newsletterInfo.audience_demographics.age_range}
                        onChange={(e) => handleInputChange('audience_demographics.age_range', e.target.value)}
                        required
                    >
                        <option value="">Select age range</option>
                        <option value="18-25">18-25</option>
                        <option value="26-35">26-35</option>
                        <option value="36-45">36-45</option>
                        <option value="45+">45+</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Income Range *</label>
                    <select
                        value={newsletterInfo.audience_demographics.income_range}
                        onChange={(e) => handleInputChange('audience_demographics.income_range', e.target.value)}
                        required
                    >
                        <option value="">Select income range</option>
                        <option value="<50K">Less than $50K</option>
                        <option value="50-100K">$50K - $100K</option>
                        <option value="100K+">$100K+</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Primary Location *</label>
                    <select
                        value={newsletterInfo.audience_demographics.location}
                        onChange={(e) => handleInputChange('audience_demographics.location', e.target.value)}
                        required
                    >
                        <option value="">Select location</option>
                        <option value="US">United States</option>
                        <option value="Europe">Europe</option>
                        <option value="Global">Global</option>
                    </select>
                </div>

                <div className="form-group full-width">
                    <label>Audience Interests (select all that apply)</label>
                    <div className="checkbox-grid">
                        {interests.map(interest => (
                            <label key={interest} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={newsletterInfo.audience_demographics.interests.includes(interest)}
                                    onChange={() => handleArrayToggle('audience_demographics.interests', interest)}
                                />
                                <span>{interest}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group full-width">
                    <label>Job Titles (select all that apply)</label>
                    <div className="checkbox-grid">
                        {jobTitles.map(title => (
                            <label key={title} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={newsletterInfo.audience_demographics.job_titles.includes(title)}
                                    onChange={() => handleArrayToggle('audience_demographics.job_titles', title)}
                                />
                                <span>{title}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="onboarding-step">
            <div className="onboarding-header">
                <FontAwesomeIcon icon={faDollarSign} className="onboarding-icon" />
                <h2>Your sponsorship experience</h2>
                <p>Help us understand your current sponsorship situation</p>
            </div>
            
            <div className="onboarding-form">
                <div className="form-group full-width">
                    <label>Previous Sponsors (optional)</label>
                    <textarea
                        value={newsletterInfo.sponsorship_history.previous_sponsors.join(', ')}
                        onChange={(e) => handleInputChange('sponsorship_history.previous_sponsors', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                        placeholder="e.g., Stripe, Notion, Linear"
                        rows={3}
                    />
                </div>

                <div className="form-group">
                    <label>Typical Rates (optional)</label>
                    <div className="rate-inputs">
                        <div className="rate-input">
                            <label>Newsletter Mention</label>
                            <input
                                type="number"
                                min="0"
                                value={newsletterInfo.sponsorship_history.typical_rates.newsletter_mention || ''}
                                onChange={(e) => handleInputChange('sponsorship_history.typical_rates.newsletter_mention', parseInt(e.target.value) || 0)}
                                placeholder="e.g., 500"
                            />
                        </div>
                        <div className="rate-input">
                            <label>Dedicated Email</label>
                            <input
                                type="number"
                                min="0"
                                value={newsletterInfo.sponsorship_history.typical_rates.dedicated_email || ''}
                                onChange={(e) => handleInputChange('sponsorship_history.typical_rates.dedicated_email', parseInt(e.target.value) || 0)}
                                placeholder="e.g., 1000"
                            />
                        </div>
                        <div className="rate-input">
                            <label>Banner Ad</label>
                            <input
                                type="number"
                                min="0"
                                value={newsletterInfo.sponsorship_history.typical_rates.banner_ad || ''}
                                onChange={(e) => handleInputChange('sponsorship_history.typical_rates.banner_ad', parseInt(e.target.value) || 0)}
                                placeholder="e.g., 200"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="onboarding-step">
            <div className="onboarding-header">
                <FontAwesomeIcon icon={faEnvelope} className="onboarding-icon" />
                <h2>Your outreach preferences</h2>
                <p>How do you like to communicate with sponsors?</p>
            </div>
            
            <div className="onboarding-form">
                <div className="form-group">
                    <label>Email Style *</label>
                    <select
                        value={newsletterInfo.outreach_preferences.style}
                        onChange={(e) => handleInputChange('outreach_preferences.style', e.target.value)}
                        required
                    >
                        <option value="">Select style</option>
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="personal">Personal</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Follow-up Frequency *</label>
                    <select
                        value={newsletterInfo.outreach_preferences.follow_up_frequency}
                        onChange={(e) => handleInputChange('outreach_preferences.follow_up_frequency', e.target.value)}
                        required
                    >
                        <option value="">Select frequency</option>
                        <option value="once">Once</option>
                        <option value="twice">Twice</option>
                        <option value="three_times">Three times</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Minimum Deal Size ($)</label>
                    <input
                        type="number"
                        min="0"
                        value={newsletterInfo.outreach_preferences.minimum_deal_size || ''}
                        onChange={(e) => handleInputChange('outreach_preferences.minimum_deal_size', parseInt(e.target.value) || 0)}
                        placeholder="e.g., 500"
                    />
                </div>
            </div>
        </div>
    );

    const renderProgressBar = () => (
        <div className="onboarding-progress">
            <div className="progress-bar">
                <div 
                    className="progress-fill" 
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
            </div>
            <span className="progress-text">Step {currentStep} of 4</span>
        </div>
    );

    return (
        <div className="newsletter-onboarding">
            {renderProgressBar()}
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            
            <div className="onboarding-actions">
                {currentStep > 1 && (
                    <button 
                        className="btn btn-secondary" 
                        onClick={prevStep}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                )}
                
                <div className="onboarding-actions-right">
                    <button 
                        className="btn btn-outline" 
                        onClick={onSkip}
                    >
                        Skip for now
                    </button>
                    
                    <button 
                        className="btn btn-primary" 
                        onClick={nextStep}
                    >
                        {currentStep === 4 ? 'Complete Setup' : 'Next'}
                        {currentStep < 4 && <FontAwesomeIcon icon={faArrowRight} />}
                        {currentStep === 4 && <FontAwesomeIcon icon={faCheck} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewsletterOnboarding;

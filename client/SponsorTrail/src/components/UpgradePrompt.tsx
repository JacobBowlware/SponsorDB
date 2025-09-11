import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRocket, faCrown, faChartLine, faUsers, faClock, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

interface UpgradePromptProps {
    sponsorCount: number;
    newsletterCount: number;
    onUpgradeClick: () => void;
}

const UpgradePrompt = ({ sponsorCount, newsletterCount, onUpgradeClick }: UpgradePromptProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentFeature, setCurrentFeature] = useState(0);

    useEffect(() => {
        // Show the prompt after a short delay
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Rotate through features every 3 seconds
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % 3);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: faRocket,
            title: "Unlock Premium Access",
            description: "Get instant access to our complete database of verified sponsors",
            highlight: `${sponsorCount}+ sponsors`
        },
        {
            icon: faChartLine,
            title: "Boost Your Revenue",
            description: "Newsletter creators earn 3x more with our premium insights",
            highlight: "3x revenue"
        },
        {
            icon: faClock,
            title: "Save Hours Weekly",
            description: "Skip the research and focus on creating great content",
            highlight: "5+ hours saved"
        }
    ];

    const stats = [
        { number: sponsorCount, label: "Active Sponsors", icon: faUsers },
        { number: newsletterCount, label: "Newsletters", icon: faCrown },
        { number: "95%", label: "Success Rate", icon: faCheckCircle }
    ];

    return (
        <div className={`upgrade-prompt ${isVisible ? 'visible' : ''}`}>
            <div className="upgrade-prompt__container">
                <div className="upgrade-prompt__content">
                    <div className="upgrade-prompt__header">
                        <div className="upgrade-prompt__badge">
                            <FontAwesomeIcon icon={faCrown} />
                            Premium Access
                        </div>
                        <h2 className="upgrade-prompt__title">
                            Ready to Scale Your Newsletter?
                        </h2>
                        <p className="upgrade-prompt__subtitle">
                            Join thousands of creators who've found their perfect sponsors
                        </p>
                    </div>

                    <div className="upgrade-prompt__feature-showcase">
                        <div className="upgrade-prompt__feature-card">
                            <div className="upgrade-prompt__feature-icon">
                                <FontAwesomeIcon icon={features[currentFeature].icon} />
                            </div>
                            <div className="upgrade-prompt__feature-content">
                                <h3 className="upgrade-prompt__feature-title">
                                    {features[currentFeature].title}
                                </h3>
                                <p className="upgrade-prompt__feature-description">
                                    {features[currentFeature].description}
                                </p>
                                <div className="upgrade-prompt__feature-highlight">
                                    {features[currentFeature].highlight}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="upgrade-prompt__stats">
                        {stats.map((stat, index) => (
                            <div key={index} className="upgrade-prompt__stat">
                                <div className="upgrade-prompt__stat-icon">
                                    <FontAwesomeIcon icon={stat.icon} />
                                </div>
                                <div className="upgrade-prompt__stat-number">{stat.number}</div>
                                <div className="upgrade-prompt__stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="upgrade-prompt__cta">
                        <button 
                            className="upgrade-prompt__upgrade-btn"
                            onClick={onUpgradeClick}
                        >
                            <FontAwesomeIcon icon={faRocket} />
                            Upgrade Now
                        </button>
                        <p className="upgrade-prompt__guarantee">
                            30-day money-back guarantee • Cancel anytime
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradePrompt; 
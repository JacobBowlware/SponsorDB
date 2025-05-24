// React
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";
import SponsorTable from '../components/SponsorTable';

// Font Awesome Icons
import { faArrowRight, faSyncAlt, faStopwatch, faSliders, faCheckCircle, faComputer, faHardDrive, faMoneyCheckDollar, faSuitcase, faSpa, faFilm, faCartShopping, faExternalLink, faDatabase, faUsers, faGraduationCap, faHeartbeat, faLaptopCode, faGamepad, faEnvelope, faSort, faSortUp, faSortDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Images
import ProjectSS from '../assets/images/ProjectSS.png';
import config from '../config';
import axios from 'axios';

interface HomeProps {
    purchased: boolean,
    email: string,
    sponsorCount: number,
    newsletterCount: number,
    lastUpdated: string
}

interface Sponsor {
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    dateAdded: string;
}

const exampleSponsors: Sponsor[] = [
    {
        sponsorName: "TechCorp",
        sponsorLink: "https://techcorp.com",
        tags: ["Technology", "Software"],
        newsletterSponsored: "Tech Weekly",
        subscriberCount: 50000,
        businessContact: "john@techcorp.com",
        dateAdded: "2024-01-15"
    },
    {
        sponsorName: "HealthPlus",
        sponsorLink: "https://healthplus.com",
        tags: ["Health", "Wellness"],
        newsletterSponsored: "Health Digest",
        subscriberCount: 75000,
        businessContact: "sarah@healthplus.com",
        dateAdded: "2024-02-01"
    },
    {
        sponsorName: "EduTech",
        sponsorLink: "https://edutech.com",
        tags: ["Education", "Technology"],
        newsletterSponsored: "Learning Today",
        subscriberCount: 100000,
        businessContact: "mike@edutech.com",
        dateAdded: "2024-02-15"
    },
    {
        sponsorName: "EntertainCo",
        sponsorLink: "https://entertainco.com",
        tags: ["Entertainment", "Media"],
        newsletterSponsored: "Entertainment Weekly",
        subscriberCount: 150000,
        businessContact: "lisa@entertainco.com",
        dateAdded: "2024-03-01"
    },
    {
        sponsorName: "FinTech Solutions",
        sponsorLink: "https://fintechsolutions.com",
        tags: ["Finance", "Technology"],
        newsletterSponsored: "Finance Daily",
        subscriberCount: 200000,
        businessContact: "david@fintechsolutions.com",
        dateAdded: "2024-03-15"
    },
    {
        sponsorName: "WellnessPro",
        sponsorLink: "https://wellnesspro.com",
        tags: ["Health", "Lifestyle"],
        newsletterSponsored: "Wellness Weekly",
        subscriberCount: 125000,
        businessContact: "emma@wellnesspro.com",
        dateAdded: "2024-04-01"
    },
    {
        sponsorName: "EduLearn",
        sponsorLink: "https://edulearn.com",
        tags: ["Education", "Online Learning"],
        newsletterSponsored: "Education Today",
        subscriberCount: 90000,
        businessContact: "peter@edulearn.com",
        dateAdded: "2024-04-15"
    },
    {
        sponsorName: "TechStart",
        sponsorLink: "https://techstart.com",
        tags: ["Technology", "Startups"],
        newsletterSponsored: "Tech Trends",
        subscriberCount: 110000,
        businessContact: "anna@techstart.com",
        dateAdded: "2024-05-01"
    }
];

const Home = ({ purchased, email, newsletterCount, sponsorCount, lastUpdated }: HomeProps) => {
    const [sampleSponsors, setSampleSponsors] = useState<Sponsor[]>(exampleSponsors);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [sortColumn, setSortColumn] = useState<string>('subscribers');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const filteredSponsors = activeFilter === 'all' 
        ? sampleSponsors 
        : sampleSponsors.filter(sponsor => 
            sponsor.tags.some(tag => tag.toLowerCase() === activeFilter.toLowerCase())
        );

    const sortedSponsors = [...filteredSponsors].sort((a, b) => {
        if (sortColumn === 'subscribers') {
            return sortDirection === 'asc' ? a.subscriberCount - b.subscriberCount : b.subscriberCount - a.subscriberCount;
        } else if (sortColumn === 'date') {
            return sortDirection === 'asc' ? new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime() : new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        }
        return 0;
    });

    const getTagClass = (tag: string) => {
        const tagClass = tag.toLowerCase().replace(/\s+/g, '-');
        return `sponsor-table__tag sponsor-table__tag--${tagClass}`;
    };

    const getSortIcon = (column: string) => {
        if (sortColumn === column) {
            return sortDirection === 'asc' ? faSortUp : faSortDown;
        }
        return faSort;
    };

    const handleSort = (column: string) => {
        if (column === sortColumn) {
            setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0" id="sample-data">
                <div className="web-section__container web-section-content">
                    <div className="hero-content">
                        <div className="hero-text">
                    <h1 className="web-section__container-header airtable-header">
                        Easily Find Your Next Newsletter Sponsor
                    </h1>
                    <p className="airtable-p">
                                Access our curated list of proven newsletter sponsors, so you can spend less time searching and more time growing your newsletter.
                            </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; {sponsorCount} sponsors from {newsletterCount} newsletters, including TLDR Daily, The Hustle, and Morning Brew.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; Sort by market type or audience size to find your perfect match.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; No middlemen. Direct contact details for sponsors – no hidden fees or commissions.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} /> &nbsp; Download the full database as a CSV and start pitching in minutes.
                    </p>
                    <Link to="/signup" className="btn home__container-item__btn mb-3">
                        Find Sponsors Now &nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                    </Link>
                        </div>
                        <div className="hero-video">
                            Demo Video Coming Soon
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="web-section web-section-dark" >
                <div className="web-section__container web-section-content" id="features">
                    <h2 className="web-section__container-header-sm features-header">
                        Key Features
                    </h2>
                    <div className="home__features-list">
                        <FeatureCard icon={faSliders} header="Easy to Use" text="Effortlessly filter and sort the database by audience size, market, date added, or sponsor name." />
                        <FeatureCard icon={faSyncAlt} header="Stay Updated" text="We regularly update our database with new sponsors, ensuring you always have the latest opportunities." />
                        <FeatureCard highlighted={true} header="No Hidden Fees" icon={faStopwatch} text="No commissions, middleman fees, or extra charges. Just a straightforward one-time payment for full access to the database." />
                    </div>
                </div>
            </div> */}
            <div className="web-section" >
                <div className="web-section__container web-section-content">
                    <div className="sponsor-table__cont web-section-content">
                        <h2 className="sponsor-table__cont-header home-sponsors__header">
                            Sample Sponsor Database
                        </h2>
                        <p className="sponsor-table__cont-header-p mt-2">
                            Signup for full access to our datasets & database of <strong>{sponsorCount ? sponsorCount : 250}+</strong> sponsors from <strong>{newsletterCount ? newsletterCount : 50}+</strong> newsletters.
                        </p>
                        <div className="sponsor-table__filter-buttons">
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                <FontAwesomeIcon icon={faDatabase} className="sponsor-table__filter-button-icon" />
                                All Sponsors
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'technology' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('technology')}
                            >
                                <FontAwesomeIcon icon={faLaptopCode} className="sponsor-table__filter-button-icon" />
                                Technology
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'health' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('health')}
                            >
                                <FontAwesomeIcon icon={faHeartbeat} className="sponsor-table__filter-button-icon" />
                                Health
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'education' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('education')}
                            >
                                <FontAwesomeIcon icon={faGraduationCap} className="sponsor-table__filter-button-icon" />
                                Education
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'entertainment' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('entertainment')}
                            >
                                <FontAwesomeIcon icon={faGamepad} className="sponsor-table__filter-button-icon" />
                                Entertainment
                            </button>
                        </div>
                        <div className="airtable-cont">
                            {loading ? (
                                <div className="sponsor-table__loading">Loading sample sponsors...</div>
                            ) : error ? (
                                <div className="sponsor-table__error">{error}</div>
                            ) : (
                                <div className="sponsor-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th className="sponsor-table__column-header">Sponsor</th>
                                                <th className="sponsor-table__column-header">Contact/Apply</th>
                                                <th className="sponsor-table__column-header">Newsletter</th>
                                                <th style={{textWrap: 'nowrap'}}>
                                                    Subscribers
                                                    <FontAwesomeIcon 
                                                        icon={getSortIcon('subscribers')} 
                                                        className="sponsor-table__sort-icon"
                                                        onClick={() => handleSort('subscribers')}
                                                    />
                                                </th>
                                                <th style={{textAlign: 'left'}}>Tags</th>
                                                <th style={{textWrap: 'nowrap'}}>
                                                    Date Added
                                                    <FontAwesomeIcon 
                                                        icon={getSortIcon('date')} 
                                                        className="sponsor-table__sort-icon"
                                                        onClick={() => handleSort('date')}
                                                    />
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedSponsors.map((sponsor, index) => (
                                                <tr  key={index}>
                                                    <td className="sponsor-table__row">
                                                        <a 
                                                            href={sponsor.sponsorLink} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="sponsor-table__link"
                                                        >
                                                            {sponsor.sponsorName}
                                                            <FontAwesomeIcon 
                                                                icon={faExternalLink} 
                                                                className="sponsor-table__link-icon" 
                                                            />
                                                        </a>
                                                    </td>
                                                    <td className="sponsor-table__row">
                                                        {sponsor.businessContact.includes('@') ? (
                                                            <a 
                                                                href={`mailto:${sponsor.businessContact}`}
                                                                className="sponsor-table__link"
                                                            >
                                                                {sponsor.businessContact}
                                                            </a>
                                                        ) : (
                                                            <a 
                                                                href={sponsor.businessContact}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="sponsor-table__link"
                                                            >
                                                                Apply
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td className="sponsor-table__row">{sponsor.newsletterSponsored}</td>
                                                    <td className="sponsor-table__row">{sponsor.subscriberCount.toLocaleString()}</td>
                                                    <td>
                                                        <div className="sponsor-table__tags">
                                                            {sponsor.tags.map((tag, tagIndex) => (
                                                                <span key={tagIndex} className={getTagClass(tag)}>
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="sponsor-table__row">{new Date(sponsor.dateAdded).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="sponsor-table__sample-note">
                                        This is a sample of our database. Sign up to access the full list of {sponsorCount ? sponsorCount : 250}+ sponsors.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="web-section web-section-dark subscribe">
                <div className="web-section__container web-section-content">
                    <div className="home__pricing-container" id="pricing">
                        <div className="home__pricing-item">
                            {/* <h2 className="home__pricing-header">
                                One Time Payment. Full Access.
                            </h2> */}
                            <div className="home__pricing-card">
                                <div className="home__pricing-card__header">
                                    <h3 className="home__pricing-card__header-h3">One Time Payment. Lifetime Access.
                                    </h3>
                                    <p className="home__pricing-card__header-p">
                                        {sponsorCount ? sponsorCount :
                                            250}+ Sponsors
                                    </p>
                                </div>
                                <p className="home__pricing-card__text mt-2">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; <strong>{sponsorCount}+ Sponsors:</strong> From companies like Eight Sleep, ExpressVPN, and EmailTree.
                                </p>
                                <p className="home__pricing-card__text">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; <strong>Advanced Filters:</strong> Sort by market type or audience size to find the perfect sponsors.
                                </p>
                                <p className="home__pricing-card__text">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; <strong>Regular Updates:</strong> New sponsors added every week – never miss an opportunity.
                                </p>
                                <p className="home__pricing-card__text">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; <strong>Export & Go:</strong> Download the full database as a CSV and start pitching in minutes.
                                </p>
                                <Link className="btn home__pricing-card__btn" to="/signup">
                                    $64.99 -- Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="web-section" >
                <div className="web-section__container web-section-content" id="testimonials">
                    <h2 className="web-section__container-header-sm">
                        Testimonials
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John D." affiliation="Content Creator" quote="I was able to find 3 sponsors in 2 weeks using SponsorDB. It saved me hours of research!" />
                        <TestimonialCard name="Alex J." affiliation="Sponsor" quote="We're just launching, and we'd love your feedback! Be one of the first to try SponsorDB and leave a review." />
                    </div>
                    {purchased && <Link className="footer-item footer-item__highlight mt-2" to="/review">
                        Leave a Review
                        &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </Link>}
                </div>
            </div> */}
            {/* <div className="web-section web-section-dark" id="pricing">
                <div className="web-section-content home__pricing-container">
                    <Pricing isSubscribed={isSubscribed} />
                    <img className="home__pricing-img" src={ExampleSponsors} alt="Pricing" />
                </div>
            </div> */}

            <div className="web-section web-section__container web-section-content" id="FAQ">
                <h2 className="web-section__container-header-sm">
                    Frequently Asked Questions
                </h2>
                <FAQAccordian />
            </div>
            <Link to="/signup" className="btn home__container-item__btn mb-5">
                Start Finding Sponsors&nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
            </Link>
        </div>
    );
};

export default Home;
// React
import { Link } from "react-router-dom";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";

// Font Awesome Icons
import { faArrowRight, faSyncAlt, faStopwatch, faSliders, faCheckCircle, faComputer, faHardDrive, faMoneyCheckDollar, faSuitcase, faSpa, faFilm, faCartShopping } from "@fortawesome/free-solid-svg-icons";

// Images
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface HomeProps {
    purchased: boolean,
    email: string,
    sponsorCount: number,
    newsletterCount: number,
    lastUpdated: string
}

const Home = ({ purchased, email, newsletterCount, sponsorCount, lastUpdated }: HomeProps) => {
    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0" id="sample-data" >
                <div className="web-section__container web-section-content">
                    <h1 className="web-section__container-header airtable-header">
                        Easily Find Your Next Newsletter Sponsor
                    </h1>
                    <p className="airtable-p">
                        Access our curated list of proven newsletter sponsors, so you can spend less time searching and more time growing your newsletter.                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; High quality sponsors with proven track records, updated regularly.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; Easily filter and sort our database to find the perfect sponsor for your newsletter.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; No hidden fees or commissions. Just a one-time payment for full access to the database.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} /> &nbsp; Easily download the database into a CSV file.
                    </p>
                    <Link to="/signup" className="btn home__container-item__btn mb-3">
                        Find Sponsors &nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                    </Link>
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
                        <p className="airtable-p  mt-2">
                            Signup for full access to our datasets & database of <strong>{sponsorCount ? sponsorCount : 200}+</strong> sponsors from <strong>{newsletterCount ? newsletterCount : 50}+</strong> newsletters.
                        </p>
                        <p className="sponsor-table__cont-header-h3 mb-0">
                            <strong>Popular Datasets</strong>
                        </p>
                        <div className="sponsor-tables__cont mb-2 mt-2">
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrPy6pdhaTW2abA4" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faComputer} /> Technology
                            </a>
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrb1AomDtni7XG0O" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faHardDrive} /> Software
                            </a>
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shra8LcSxuNvNDYlr" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faMoneyCheckDollar} />Finance
                            </a>
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shr7aH7YSv4d71MEc" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faSuitcase} />Business & Marketing
                            </a>
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shr8qnI3QJAtkNO0y" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faSpa} /> Health & Wellness
                            </a>
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shreUtIAQLwcBiotP" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faCartShopping} />Ecommerce
                            </a>
                        </div>
                        <div className="sponsor-tables__cont mb-3">
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrwYXYNBS43rNiJR" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                0 - 50,000 Subscribers
                            </a>
                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrYVTs2qVEWqWSdW" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                50,000 - 100,000 Subscribers
                            </a>

                            <a href="https://airtable.com/appn3l7KEp7wAQOZu/shr3dEUff1l051OUq" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                                100,000 - 500,000 Subscribers
                            </a>
                        </div>
                        <p className="sponsor-table__cont-header-h3 mb-1">
                            Sample Database
                        </p>
                        <div className="airtable-cont">
                            <AirTable />
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
                                            200}+ Sponsors
                                    </p>
                                </div>
                                <p className="home__pricing-card__text mt-2">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Access our growing database of high-quality newsletter sponsors
                                </p>
                                <p className="home__pricing-card__text">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Sort sponsors by audience size, market type, or date added to find the perfect match for your newsletter
                                </p>
                                <p className="home__pricing-card__text">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Updated daily with new sponsorship opportunities </p>
                                <p className="home__pricing-card__text">
                                    <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Easily download the database into a CSV file
                                </p>
                                <Link className="btn home__pricing-card__btn" to="/signup">
                                    $29.99 -- Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/*<div className="web-section" >
                <div className="web-section__container web-section-content" id="testimonials">
                    <h2 className="web-section__container-header-sm">
                        Testimonials
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John D." affiliation="Content Creator" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Alex J." affiliation="Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                    </div>
                    {purchased && <Link className="footer-item footer-item__highlight mt-2" to="/review">
                        Leave a Review
                        &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </Link>}
                </div>
            </div>*/}
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
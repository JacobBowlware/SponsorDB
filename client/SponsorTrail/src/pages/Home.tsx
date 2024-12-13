// React
import { Link } from "react-router-dom";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";
import { Pricing } from "../components/Pricing";

// Font Awesome Icons
import { faArrowRight, faThumbsUp, faSyncAlt, faStopwatch, faSliders, faCheck, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

// Images
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ExampleSponsors from '../assets/images/ExampleSponsors.png';

interface HomeProps {
    purchased: boolean,
    email: string,
    sponsorCount: number,
}

const Home = ({ purchased, email, sponsorCount }: HomeProps) => {
    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0" id="sample-data" >
                <div className="web-section__container web-section-content">
                    <h1 className="web-section__container-header airtable-header">
                        Newsletter Sponsorships, Made Simple
                    </h1>
                    <p className="airtable-p">
                        Access our curated list of proven newsletter sponsors, so you can spend less time searching and more time expanding your newsletter.                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; High quality sponsors with proven track records, updated regularly.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; Easily filter and sort the database to find the perfect sponsor for your newsletter.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} className="airtable-icon" /> &nbsp; No hidden fees or commissions. Just a one-time payment for full access to the database.
                    </p>
                    <p className="airtable-p">
                        <FontAwesomeIcon icon={faCheckCircle} /> &nbsp; Easily download the database to a CSV file.
                    </p>
                    <Link to="/signup" className="btn home__container-item__btn mb-3">
                        Find Sponsors &nbsp; <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                    </Link>
                    <div className="instructions">
                        <h2 className="web-section__container-header-sm airtable-header-sm">
                            Connecting with Potential Sponsors
                        </h2>
                        <p className="airtable-p">
                            Browse sponsor websites for partnership or advertising info. If none is available, email them with your newsletter's details, such as subscriber count and audience demographics.
                        </p>
                        <p className="airtable-p airtable-note">
                            Signup to access the full database of {sponsorCount} sponsors.
                        </p>
                    </div>
                    <div className="airtable-cont">
                        <AirTable />
                    </div>
                </div>
            </div>
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="features">
                    <h2 className="web-section__container-header-sm features-header">
                        Why SponsorDB?
                    </h2>
                    <div className="home__features-list">
                        <FeatureCard icon={faSliders} header="Easy to Use" text="Effortlessly filter and sort the database by audience size, tags, date added, or sponsor name." />
                        <FeatureCard icon={faSyncAlt} header="Stay Updated" text="We regularly update our database with new sponsors, ensuring you always have the latest opportunities." />
                        <FeatureCard highlighted={true} header="No Hidden Fees" icon={faStopwatch} text="No commissions, middleman fees, or extra charges. Just a straightforward one-time payment for full access to the database." />
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
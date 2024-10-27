// React
import { Link } from "react-router-dom";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";
import Pricing from "../components/Pricing";

// Font Awesome Icons
import { faCheckCircle, faArrowRight, faThumbsUp, faSyncAlt, faStopwatch } from "@fortawesome/free-solid-svg-icons";

// Images
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface HomeProps {
    isSubscribed: boolean,
    email: string,
}

const Home = ({ isSubscribed, email }: HomeProps) => {


    return (
        <div className="web-page">
            <div className="web-section web-section-dark" id="sample-data" >
                <div className="web-section__container web-section-content">
                    <h1 className="web-section__container-header airtable-header">
                        Maximize your Newsletter Sponsorships
                    </h1>
                    <p className="airtable-p">
                        Access our database of proven newsletter sponsors. Spend less time searching and more time earning.
                    </p>
                    <p>
                        (8,000+ records from 1,000+ companies)
                    </p>
                    <a href="/#pricing" className="btn home__container-item__input home__container-item__btn mb-3">
                        Access Full Database
                    </a>
                    <p className="airtable-p airtable-note">
                        Below is a sample of the data in our database. For full access, please login.
                    </p>
                    <div className="airtable-cont">
                        <AirTable />
                    </div>
                </div>
            </div>
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="features">
                    <h2 className="web-section__container-header">
                        Why SponsorDB?
                    </h2>
                    <div className="home__features-list">
                        <FeatureCard icon={faThumbsUp} header="Easy to Use" text="Our database is designed to be user-friendly. Quickly find sponsors that match your newsletter." />
                        <FeatureCard icon={faSyncAlt} header="Stay Updated" text="We regularly update our database with new sponsors, ensuring you always have the latest opportunities." />
                        <FeatureCard highlighted={true} header="Time Saver" icon={faStopwatch} text="Spend less time searching for sponsors and more time growing your newsletter." />
                    </div>
                </div>
            </div>
            <div className="web-section web-section-dark" id="pricing">
                <Pricing isSubscribed={isSubscribed} />
            </div>
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="testimonials">
                    <h2 className="web-section__container-header-sm">
                        Testimonials
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John D." affiliation="Content Creator" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Alex J." affiliation="Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                    </div>
                    {isSubscribed && <Link className="footer-item footer-item__highlight mt-2" to="/review">
                        Leave a Review
                        &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </Link>}
                </div>
                <div className="web-section" >
                    <div className="web-section__container web-section-content" id="FAQ">
                        <h2 className="web-section__container-header-sm">
                            Frequently Asked Questions
                        </h2>
                        <FAQAccordian />
                    </div>
                </div>
                <button onClick={() => {
                    if (email === "") {
                        window.location.href = "/signup";
                    } else if (email !== "" && isSubscribed === true) {
                        window.location.href = "/sponsors";
                    }
                    else {
                        window.location.href = "/subscribe";
                    }
                }} className="btn home__container-item__btn">
                    Access Full Database &nbsp; <FontAwesomeIcon icon={faArrowRight} />
                </button>
            </div>
        </div >
    );
};

export default Home;
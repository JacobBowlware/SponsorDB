// React
import { Link } from "react-router-dom";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";

// Font Awesome Icons
import { faCheckCircle, faCalendarDays, faMoneyBill, faArrowRight } from "@fortawesome/free-solid-svg-icons";

// Images
import search from './../assets/images/search.png';
import list from './../assets/images/list.png';
import growth from './../assets/images/growth.png';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Home = () => {

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
                    <Link to="/login" className="btn home__container-item__input home__container-item__btn mb-3">
                        Access Full Database
                    </Link>
                    <p className="airtable-p airtable-note">
                        Below is a sample of the data in our database. For full access, please login.
                    </p>
                    <div className="airtable-cont">
                        <AirTable />
                    </div>
                </div>
            </div>
            {/* <div className="web-section home" id="hero">
                <div className="web-section__container home__container">
                    <div className="home__container-item">
                        <h2 className="home__container-item__header">
                            Maximize Newsletter Sponsorships
                        </h2>
                        <p className="home__container-item__p">
                            Access our free database of proven sponsors in your niche. Spend less time searching and more time earning.

                        </p>
                        <form className="home__container-item__form" onSubmit={(e) => handleSubmit(e)} id="email-form">
                            <div className="home__container-item__input-wrapper">
                                <Link to="/login" className="btn home__container-item__input home__container-item__btn-secondary">
                                    Login
                                </Link>
                                <Link to="/signup" className="btn home__container-item__input home__container-item__btn">
                                    Sign-up for Free
                                </Link>
                            </div>
                            {userEmailCollected && <p className="home__container-item__form-thanks">
                                Thank you for joining the SponsorDB waitlist! We'll be in touch soon.
                            </p>}
                        </form>
                    </div>
                </div>
            </div> */}
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="features">
                    <h2 className="web-section__container-header">
                        Why SponsorDB?
                    </h2>
                    <div className="home__features-list">
                        <FeatureCard icon={faCalendarDays} header="Stay Updated" text="View the latest sponsorship deals happening among your competitors and other newsletters." />
                        <FeatureCard icon={faMoneyBill} header="Free to Use" text="Access our database of sponsors for free. No hidden fees or charges." />
                        <FeatureCard highlighted={true} header="Time Saver" icon={faCheckCircle} text="Spend less time searching for sponsors. Our database is designed to streamline the sponsorship process." />
                    </div>
                </div>
            </div>
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="how-it-works">
                    <h2 className="web-section__container-header-sm">
                        How It Works
                    </h2>
                    <div className="home__how-it-works-container">
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                1. Data Collection
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                Data is collected from reputable sources, compiling information on real sponsorships, companies, and newsletters.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img" src={search} alt="A team searching the web and gathering data on potential podcast sponsors for our clients." />
                        <img className="home__how-it-works-container__img" src={list} alt="A team preparing to send a list of potential podcast sponsors to our clients." />
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                2. Data Verification
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                The data is then verified and organized into our database, ensuring that you're only presented with the most reliable information available.
                            </p>
                        </div>
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                3. You Apply
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                With our complete database of sponsors in hand, you can begin applying for sponsorships and growing your newsletter.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img home__how-it-works-container__img-shown" src={growth} alt="Person applying themselves and applying for Podcast sponsorships." />
                    </div>
                </div>
            </div>
            {/* <div className="web-section" >
                <div className="web-section__container web-section-content" id="pricing">
                    <h2 className="web-section__container-header-sm">
                        Pricing Options
                    </h2>
                    <div className="home__pricing-container">
                        <PricingCard header="Monthly"
                            icon={faRocket}
                            price="$15"
                            year={false}
                            text="Access our database of sponsors for a month. Cancel anytime." />
                        <PricingCard header="Yearly"
                            icon={faDiamond}
                            price="$120"
                            year={true}
                            text="Access our database of sponsors for a year. Cancel anytime." />
                    </div>
                </div>
            </div> */}
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="testimonials">
                    <h2 className="web-section__container-header-sm">
                        Testimonials
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John D." affiliation="Content Creator" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Alex J." affiliation="Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                    </div>
                    <Link className="footer-item footer-item__highlight mt-2" to="/review">
                        Leave a Review
                        &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </Link>
                </div>
                <div className="web-section" >
                    <div className="web-section__container web-section-content" id="FAQ">
                        <h2 className="web-section__container-header-sm">
                            Frequently Asked Questions
                        </h2>
                        <FAQAccordian />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Home;
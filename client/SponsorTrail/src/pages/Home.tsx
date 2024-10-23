// React
import { Link } from "react-router-dom";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";
import axios from "axios";
import config from "../config"

// Font Awesome Icons
import { faCheckCircle, faArrowRight, faThumbsUp, faSyncAlt, faStopwatch } from "@fortawesome/free-solid-svg-icons";

// Images
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Stripe
import { loadStripe } from '@stripe/stripe-js';

const stripeAPIKey = "pk_test_51MpGntBKPgChhmNg63yLnqWVTfzn82jI0aEnzjwvRsTz1tFfUjDnWyMCOXTFuzY4P3QdmRINR04vxOm2pD4vQhyt000Bqbmgv3";
const stripePromise = loadStripe(stripeAPIKey);

interface HomeProps {
    isSubscribed: boolean,
    email: string,
}

const Home = ({ isSubscribed, email }: HomeProps) => {
    const handleSubscribe = async (tier: number) => {
        // Tier 1 = Monthly
        // Tier 2 = Yearly

        // If user is already subscribed, send them to sponsors page
        if (isSubscribed) {
            window.location.href = "/sponsors";
            return;
        }

        // Redirect to signup page if user is not logged in, after signup redirect to subscribe page
        if (!localStorage.getItem('token')) {
            window.location.href = "/signup/?redirect=subscribe";
            return;
        }


        // If user is logged in and not subscribed, create a checkout session
        try {
            const response = await axios.post(`${config.backendUrl}users/checkout`, { tier: tier },
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                });

            const sessionId = response.data.sessionId;

            const stripe = await stripePromise;

            await stripe?.redirectToCheckout({
                sessionId: sessionId
            });

        } catch (error) {
            console.log("Error subscribing", error);
        }
    }

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
            <div className="web-section" >
                {/*TODO: Add a section of images which display the database being used/the profile page of a test user (3 total?) */}
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
                                Data is consistently collected from reputable sources, compiling information on real sponsorships, companies, and newsletters.
                            </p>
                        </div>
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
                    </div>
                </div>
            </div>
            <div className="web-section web-section-dark">
                <div className="web-section__container-center web-section-content" id="subscribe">
                    <h2 className="subscribe__header">
                        Pricing
                    </h2>
                    <div className="subscribe__card-cont">
                        <div className="subscribe__card">
                            <div className="subscribe__card-text-cont">
                                <h3 className="subscribe__card-header">
                                    Monthly
                                </h3>
                                <div className="subscribe__card-body">
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> Unlimited access to our database of high-quality newsletter sponsors
                                    </p>
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> New sponsors added regularly, keeping your opportunities up-to-date
                                    </p>
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> No commitment—cancel anytime
                                    </p>
                                </div>
                            </div>
                            <div className="subscribe__card-footer">
                                <p className="subscribe__card-price">
                                    $20/month
                                </p>
                                <button disabled={isSubscribed} onClick={() => { handleSubscribe(1); }}
                                    className="btn subscribe__btn">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                        <div className="subscribe__card">
                            <div className="subscribe__card-text-cont">
                                <h3 className="subscribe__card-header">
                                    Yearly
                                </h3>
                                <div className="subscribe__card-body">
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> Unlimited access to our database of high-quality newsletter sponsors                                    </p>
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> New sponsors added regularly, keeping your opportunities up-to-date
                                    </p>
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> No commitment—cancel anytime
                                    </p>
                                    <p>
                                        <FontAwesomeIcon icon={faCheckCircle} /> 25% off the Monthly plan
                                    </p>
                                </div>
                            </div>
                            <div className="subscribe__card-footer">
                                <p className="subscribe__card-price">
                                    $180/year
                                </p>
                                <button disabled={isSubscribed} onClick={() => handleSubscribe(2)} className="btn subscribe__btn ">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                    <p className="airtable-p airtable-note subscribe-note">
                        All payments are secured & processed by Stripe
                    </p>
                </div>
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
            </div>
        </div >
    );
};

export default Home;
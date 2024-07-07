// React & Firebase
import { useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, addDoc, collection } from "@firebase/firestore";
import { app } from "../firebase/config";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import AirTable from "../components/AirTable.js";

// Font Awesome Icons
import { faCheckCircle, faClock, faCalendarDays } from "@fortawesome/free-solid-svg-icons";

// Images
import search from './../assets/images/search.png';
import list from './../assets/images/list.png';
import growth from './../assets/images/growth.png';

const db = getFirestore(app);
const Home = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEmailCollected, setUserEmailCollected] = useState(false);

    // Collect User Email --> Currently removed from front-end
    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const docRef = collection(db, "waitlist_emails");
            await addDoc(docRef, {
                email: email,
                date: new Date()
            });

            // Disable Form Input and Button
            const emailInput = document.getElementById('email-input') as HTMLInputElement;
            const emailBtn = document.getElementById('email-btn') as HTMLButtonElement;

            emailInput.disabled = true;
            emailBtn.disabled = true;

            setUserEmailCollected(true);
        } catch (error) {
            alert(error);
        }

        setLoading(false);
    }

    return (
        <div className="web-page">
            <div className="web-section home" id="hero">
                <div className="web-section__container home__container">
                    <div className="home__container-item">
                        <h2 className="home__container-item__header">
                            Maximize Your Sponsorships
                        </h2>
                        <p className="home__container-item__p">
                            Stop wasting time searching for sponsors. Access our free database of proven sponsors in your niche, anytime, anywhere.

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
                                Thank you for joining the SponsorTrail waitlist! We'll be in touch soon.
                            </p>}
                        </form>
                    </div>
                </div>
            </div>
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="features">
                    <h2 className="web-section__container-header">
                        Why SponsorTrail?
                    </h2>
                    <div className="home__features-list">
                        <FeatureCard icon={faCalendarDays} header="Stay Ahead of Competition" text="View the latest sponsorship deals happening in your niche." />
                        <FeatureCard icon={faCheckCircle} header="Proven Sponsors" text="Our database is filled with sponsors who have previously sponsored content in the past." />
                        <FeatureCard highlighted={true} icon={faClock} header="Time-Saver" text="Spend less time searching for sponsors. Our database is designed to streamline the sponsorship process." />
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
                                    Data is regularly collected from reputable sources, compiling information on real sponsorships and companies in your niche.
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
                                    With our complete database of sponsors in hand, you can begin applying for sponsorships!
                                </p>
                            </div>
                            <img className="home__how-it-works-container__img home__how-it-works-container__img-shown" src={growth} alt="Person applying themselves and applying for Podcast sponsorships." />
                        </div>
                    </div>
                </div>
            </div>
            <div className="web-section web-section-dark" id="sample-data" >
                <div className="web-section__container web-section-content">
                    <h2 className="web-section__container-header airtable-header">
                        See Our Data For Yourself
                    </h2>
                    <p className="airtable-p">
                        We've compiled a list of 4,000+ sponsorships from 2,000+ companies -below is a small preview.
                    </p>
                    <div className="airtable-cont">
                        <AirTable />
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
                        What People Are Saying
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John D." affiliation="Podcast Host" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Alex J." affiliation="Podcast Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                    </div>
                    {/* <Link className="footer-item footer-item__highlight mt-2" to="/review">
                        Write a Review &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </Link> */}
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
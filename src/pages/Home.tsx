// React & Firebase
import { useState } from "react";
import { getFirestore, addDoc, collection } from "@firebase/firestore";
import { app } from "../firebase/config";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";

// Font Awesome Icons
import { faArrowRight, faBook, faMoneyBill, faRocket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Images
import search from './../assets/images/search.png';
import list from './../assets/images/list.png';
import growth from './../assets/images/growth.png';
import FAQAccordian from "../components/FAQAccordian";

const db = getFirestore(app);
/**
 * TODO:
 - Handle Email Submit - DONE
 - Implement Loading Gif - Not-Done
 - Notify User of Success - DONE
 */
const Home = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEmailCollected, setUserEmailCollected] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const docRef = collection(db, "waitlist_emails");
            await addDoc(docRef, {
                email: email
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
                            Maximize Your Podcast's Sponsors
                        </h2>
                        <p className="home__container-item__p">
                            Let SponsorTrail do the legwork for you, uncovering top-tier sponsorships to boost your podcast and revenue potential.
                        </p>
                        <form className="home__container-item__form" onSubmit={(e) => handleSubmit(e)} id="email-form">
                            <div className="home__container-item__input-wrapper">
                                <input id="email-input" type="email" className="home__container-item__input" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} />
                                <button id="email-btn" className="btn home__container-item__input home__container-item__btn" type="submit">
                                    Join Waitlist
                                    <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                                </button>
                            </div>
                            {userEmailCollected && <p className="home__container-item__form-thanks">
                                Thank you for your interest in SponsorTrail! Please check your email for a confirmation message (and possibly your spam folder).
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
                        <FeatureCard icon={faBook} header="Weekly Sponsorship Updates" text="Receive a curated list of podcast sponsors every week and stay informed with." />
                        <FeatureCard icon={faRocket} header="Never Miss Out" text="Get notified when new sponsorship opportunities are available, so you can be the first to apply." />
                        <FeatureCard highlighted={true} icon={faMoneyBill} header="Maximize Sponsorships" text="Discover a wide range of sponsorship opportunities, boosting your podcast's revenue potential." />
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
                                Step 1: We Gather Data
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                Our software runs constantly, gathering information about real podcast sponsorships. We then organize this info into our database, considering things like the date, company, and podcast.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img" src={search} alt="A team searching the web and gathering data on potential podcast sponsors for our clients." />
                        <img className="home__how-it-works-container__img" src={list} alt="A team preparing to send a list of potential podcast sponsors to our clients." />
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                Step 2: We Send You a List
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                Every week, we put together a list of companies that have been sponsoring podcasts recently. We sort this list based on factors like podcast views and current sponsorship trends.                            </p>
                        </div>
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                Step 3: You Apply
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                Now, it's your turn to reach out to these companies. You can send them a message or email to discuss sponsorship opportunities for your podcast. This way, you can grow your podcast's earnings and reach more listeners.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img home__how-it-works-container__img-shown" src={growth} alt="Person applying themselves and applying for Podcast sponsorships." />
                    </div>
                    <a className="footer-item footer-item__highlight mt-2" href="/#hero">
                        Join Waitlist &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </a>
                </div>
            </div>
            <div className="web-section" >
                <div className="web-section__container web-section-content" id="testimonials">
                    <h2 className="web-section__container-header-sm">
                        What People Are Saying
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John Doe" affiliation="Podcast Host" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Demarcus Oslow" affiliation="Podcast Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                    </div>
                </div>
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
    );
}

export default Home;
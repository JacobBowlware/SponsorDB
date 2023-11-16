// React & Firebase
import { useState } from "react";
import { getFirestore, addDoc, collection } from "@firebase/firestore";
import { app } from "../firebase/config";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";

// Font Awesome Icons
import { faArrowRight, faMoneyBill, faKiwiBird, faList, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Images & Gifs
import search from './../assets/images/search.png';
import list from './../assets/images/list.png';
import growth from './../assets/images/growth.png';
import FAQAccordian from "../components/FAQAccordian";

const db = getFirestore(app);

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
                            SponsorTrail streamlines finding podcast sponsors. Access a curated list of proven sponsors, saving time and maximizing your podcast's revenue potential effortlessly.                        </p>
                        <form className="home__container-item__form" onSubmit={(e) => handleSubmit(e)} id="email-form">
                            <div className="home__container-item__input-wrapper">
                                <input id="email-input" type="email" className="home__container-item__input" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} />
                                <button id="email-btn" className="btn home__container-item__input home__container-item__btn" type="submit">
                                    {loading ? <FontAwesomeIcon className="home__container-item__btn-icon" icon={faKiwiBird} /> : "Join Waitlist "}
                                    {!loading && <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />}
                                </button>
                            </div>
                            {userEmailCollected && <p className="home__container-item__form-thanks">
                                Thank you for joining the SponsorTrail waitlist! Please check your inbox for a confirmation email (and possibly your spam folder).
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
                        <FeatureCard icon={faList} header="Curated Sponsor List" text="Access a meticulously curated list of proven podcast sponsors, instantly connecting you to revenue opportunities." />
                        <FeatureCard icon={faWandMagicSparkles} header="Effortless Updates" text="Receive regular updates with new and relevant sponsorships, making your search for sponsors hassle-free." />
                        <FeatureCard highlighted={true} icon={faMoneyBill} header="Boost Revenue" text="Maximize your podcast's revenue potential by leveraging targeted sponsorship opportunities from reputable companies." />
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
                                1. We Gather Data
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                We collect data from reputable sources, compiling information on real podcast sponsorships. Our database organizes details such as sponsorships by date, company, and podcast.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img" src={search} alt="A team searching the web and gathering data on potential podcast sponsors for our clients." />
                        <img className="home__how-it-works-container__img" src={list} alt="A team preparing to send a list of potential podcast sponsors to our clients." />
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                2. We Send You a List
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                Our team carefully selects recent podcast sponsors, ensuring only reputable companies with a strong sponsorship history are included in your tailored list.                                     </p>
                        </div>
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                3. You Apply
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                With your tailored list in hand, it's time to engage. Reach out to these reputable companies to explore sponsorship opportunities, boosting your podcast's earnings and audience reach.
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
                        <TestimonialCard name="John D." affiliation="Podcast Host" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Alex J." affiliation="Podcast Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
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
// React & Firebase
import { useState } from "react";
import { Link } from "react-router-dom";
import { getFirestore, addDoc, collection } from "@firebase/firestore";
import { app } from "../firebase/config";

// Components
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";
import FAQAccordian from "../components/FAQAccordian";
import LoadingBtn from "../components/common/LoadingBtn";
import AirTable from "../components/AirTable.js";

// Font Awesome Icons
import { faArrowRight, faMoneyBill, faList, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Images
import search from './../assets/images/search.png';
import list from './../assets/images/list.png';
import growth from './../assets/images/growth.png';
import AllBlogsItem from "../components/AllBlogsItem";

const db = getFirestore(app);

interface HomeProps {
    companyCount: number;
    sponsorCount: number;
    emailCount: number;
}

const Home = ({ companyCount, sponsorCount, emailCount }: HomeProps) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [userEmailCollected, setUserEmailCollected] = useState(false);

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
                            Maximize Your Podcast's Sponsors
                        </h2>
                        <p className="home__container-item__p">
                            SponsorTrail streamlines finding podcast sponsors. Access a curated list of proven sponsors, saving time and maximizing your podcast's revenue potential.                        </p>
                        <form className="home__container-item__form" onSubmit={(e) => handleSubmit(e)} id="email-form">
                            <div className="home__container-item__input-wrapper">
                                <input required={true} id="email-input" type="email" className="home__container-item__input" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} />
                                <LoadingBtn loading={loading} title="Join Waitlist" addClasses="btn home__container-item__input home__container-item__btn" />
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
                        <FeatureCard icon={faList} header="Curated Sponsor List" text="Access a meticulously curated list of proven podcast sponsors, connecting you to numerous revenue opportunities." />
                        <FeatureCard icon={faWandMagicSparkles} header="Effortless Updates" text="Receive regular updates with new and relevant sponsorships, making your search for sponsors stress-free." />
                        <FeatureCard highlighted={true} icon={faMoneyBill} header="Revenue Boost" text="An increse in sponsors is an increase in revenue. SponsorTrail helps you maximize your podcast's earning potential." />
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
                                Data is collected from reputable sources, compiling information on real podcast sponsorships. Our database organizes details such as sponsorships by date, company, and podcast.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img" src={search} alt="A team searching the web and gathering data on potential podcast sponsors for our clients." />
                        <img className="home__how-it-works-container__img" src={list} alt="A team preparing to send a list of potential podcast sponsors to our clients." />
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                2. Sponsor List
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                Our database is continuously updated, ensuring that you have access to the most relevant and up-to-date sponsorship opportunities. You will recieve full access to our complete list of sponsors upon subscribing. (4,000 sponsorships,  500 companies, 467 email addresses)
                            </p>
                        </div>
                        <div className="home__how-it-works-container__item">
                            <h3 className="home__how-it-works-container__item-header">
                                3. You Apply
                            </h3>
                            <p className="home__how-it-works-container__item-text text">
                                With our complete list of sponsors in hand, you can begin applying for sponsorships. Each sponsorship opportunity includes a link to the application page, allowing you to apply directly to the sponsor.
                            </p>
                        </div>
                        <img className="home__how-it-works-container__img home__how-it-works-container__img-shown" src={growth} alt="Person applying themselves and applying for Podcast sponsorships." />
                    </div>
                </div>
            </div>
            <div className="web-section web-section-dark" id="sample-data" >
                <div className="web-section__container web-section-content">
                    <h2 className="web-section__container-header airtable-header">
                        See Our Data For Yourself
                    </h2>
                    <p className="airtable-p">
                        We've compiled a list of {sponsorCount} podcast sponsorships, {companyCount} companies, and {emailCount} email addresses. Below is a small preview of our data.
                    </p>
                    <div className="airtable-cont">
                        <AirTable />
                    </div>
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
                    <Link className="footer-item footer-item__highlight mt-2" to="/review">
                        Write a Review &nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
                    </Link>
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
            <div className="web-section web-section-dark" >
                <div className="web-section__container web-section-content home-blog__container" id="FAQ">
                    <div className="home-blog__container-item">
                        <h2 className="web-section__container-header-sm home-blog__container-item__header">
                            Check Out Our Blog
                        </h2>
                        <p className="home-blog__body">
                            Our blog is a great resource for podcasters looking to learn more about podcast sponsorships. We cover topics such as how to find sponsors, how to negotiate sponsorship deals, and more.
                        </p>
                        <AllBlogsItem dark={true} small={true} body="Understanding the role of a podcast sponsor is key to leveraging their potential benefits for your podcast. What exactly defines a podcast sponsor, and how do they contribute to your podcast’s success?" title="The Role of Podcast Sponsors" link="/blogs/the-role-of-podcast-sponsors/" />
                    </div>
                    <div className="home-blog__container-item">
                        <AllBlogsItem dark={true} small={true} body="Having quality data on your podcast is a necessity when discussing potential sponsorships with companies. The following will describe the role of certain data sets and how to use them to your best advantage when negotiating for podcast sponsorships." title="Navigating Podcast Sponsorships: A Data-Driven Approach" link="/blogs/data-driven-approach/" left={true} />
                        <AllBlogsItem dark={true} small={true} body="Learn essential tips for initiating conversations with potential sponsors to elevate your podcast's content and revenue. Craft compelling messages that set the stage for successful partnerships." title="5 Tips for Reaching Out to Sponsors" link="/blogs/5-tips-reaching-out/" left={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
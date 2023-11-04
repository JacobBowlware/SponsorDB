// Font Awesome Icons
import { faArrowRight, faBook, faMoneyBill, faRocket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FeatureCard from "../components/FeatureCard";
import TestimonialCard from "../components/TestimonialCard";


/**
 * TODO:
 * - Add "Features" section. - DONE
 * - Add "How it works" section.
 * - Add "Testimonials" section.
 */
const Home = () => {
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
                        <button className="btn home__container-item__btn">
                            Learn More
                            <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="web-section" id="features">
                <div className="web-section__container web-section-content">
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
            {/* */}
            <div className="web-section" id="testimonials">
                <div className="web-section__container web-section-content">
                    <h2 className="web-section__container-header-sm">
                        What People Are Saying
                    </h2>
                    <div className="home__testimonials-list">
                        <TestimonialCard name="John Doe" affiliation="Podcast Host" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                        <TestimonialCard name="Demarcus Oslow" affiliation="Podcast Sponsor" quote="Lorem ipsum dolor sit, amet consectetur adipisicing elit. Dolorem recusandae commodi, neque laudantium soluta nihil quae enim expedita odit aliquam." />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
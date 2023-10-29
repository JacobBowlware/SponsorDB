// Font Awesome Icons
import { faArrowRight, faBell, faClipboard, faClock, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FeatureCard from "../components/FeatureCard";


/**
 * TODO:
 * - Add "Features" section. - DONE
 * - Make "Features" section dark.
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
                            Track your online activity
                        </h2>
                        <p className="home__container-item__p">
                            The chrome extension that tracks your online surfing and gives you a report of your online activity.
                        </p>
                        <button className="btn home__container-item__btn">
                            Start tracking now <FontAwesomeIcon className="home__container-item__btn-arrow-icon" icon={faArrowRight} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="web-section" id="features">
                <div className="web-section__container">
                    <h2 className="web-section__container-header">
                        Features
                    </h2>
                    <div className="home__features-list">
                        <FeatureCard icon={faClock} header="Activity Tracking" text="Real-time monitoring of your online actions." />
                        <FeatureCard icon={faBell} header="Alerts and Goals" text="Set goals and receive alerts to manage screen time effectively." />
                        <FeatureCard highlighted={true} icon={faClipboard} header="Usage Reports" text="Detailed reports on browsing habits, showing most-visited sites and daily usage." />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
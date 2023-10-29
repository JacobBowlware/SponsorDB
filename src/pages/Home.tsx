// Font Awesome Icons
import { faArrowRight, faClipboard, faClock, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


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
            <div className="web-section web-section-dark" id="features">
                <div className="web-section__container">
                    <h2 className="web-section__container-header">
                        Features
                    </h2>
                    <div className="home__features-list">
                        <div className="home__features-list__item">
                            <FontAwesomeIcon className="home__features-list__item-icon" icon={faClock} />
                            <p className="home__features-list__item-text">
                                Real-Time Activity Tracking
                            </p>
                        </div>
                        <div className="home__features-list__item">
                            <FontAwesomeIcon className="home__features-list__item-icon" icon={faClipboard} />
                            <p className="home__features-list__item-text">
                                Detailed Usage Reports
                            </p>
                        </div> <div className="home__features-list__item">
                            <FontAwesomeIcon className="home__features-list__item-icon" icon={faSliders} />
                            <p className="home__features-list__item-text">
                                Customizable Alerts and Goals
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
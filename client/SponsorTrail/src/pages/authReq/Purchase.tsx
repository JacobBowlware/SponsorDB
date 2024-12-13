import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DBLockedSS from '../../assets/images/DBLockedSS.png';
import ExampleSponsors from '../../assets/images/ExampleSponsors.png';
import { faArrowRight, faCheck } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

interface SubscribeProps {
    purchased: boolean;
}

const stripeAPIKey = "pk_live_51MpGntBKPgChhmNg9wLgFqQICAjXSVAzaEMRKwXjuLQeZZhwghaiA7VDoG0Cov9uEnDGF9RlAKQkQ1xXPSooAX8D00Mp9uCFyO";
const stripeAPIKeyTest = "pk_test_51MpGntBKPgChhmNg63yLnqWVTfzn82jI0aEnzjwvRsTz1tFfUjDnWyMCOXTFuzY4P3QdmRINR04vxOm2pD4vQhyt000Bqbmgv3";
const stripePromise = loadStripe(stripeAPIKey);


const handlePurchase = async (purchased: boolean) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }
        const response = await axios.post(`${config.backendUrl}users/checkout`, { purchased: purchased },
            {
                headers: {
                    'x-auth-token': token
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

const Subscribe = ({ purchased }: SubscribeProps) => {
    return <div className="web-page">
        <div className="web-section web-section-dark subscribe">
            <div className="web-section__container web-section-content">
                <div className="home__pricing-container" id="pricing">
                    <div className="home__pricing-item">
                        <h2 className="home__pricing-header">
                            Access the Full Database
                        </h2>
                        <div className="home__pricing-card">
                            <h3 className="home__pricing-card__header">
                                $29.99 <span className="home__pricing-card__header-note">One-time payment. Full access.</span>
                            </h3>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheck} /> Unlimited access to our database of high-quality newsletter sponsors.
                            </p>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheck} /> Sort sponsors by audience size, tags, date added, or sponsor name.
                            </p>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheck} /> Regularly updated, giving you the latest opportunities.
                            </p>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheck} /> Easily download the database to a CSV file.
                            </p>
                            <button className="btn home__pricing-card__btn" onClick={() => {
                                handlePurchase(purchased);
                            }}>
                                Get Started <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>
                    </div>
                    <img className="home__pricing-img" src={ExampleSponsors} alt="Ghost, which sponsored the newsletter Thebrowser.com, with an audience size of 150,000, sponsor link https://ghost.org/, in the Technology market." />
                </div>
            </div>
        </div>
    </div>
}

export default Subscribe;
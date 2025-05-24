import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DBLockedSS from '../../assets/images/DBLockedSS.png';
import ExampleSponsors from '../../assets/images/ExampleSponsors.png';
import { faArrowRight, faCheck, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

interface SubscribeProps {
    purchased: boolean;
    sponsorCount: number;
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

const Subscribe = ({ purchased, sponsorCount }: SubscribeProps) => {
    return <div className="web-page">
        <div className="web-section web-section-dark subscribe">
            <div className="web-section__container web-section-content">
                <div className="home__pricing-container" id="pricing">
                    <div className="home__pricing-item">
                        <div className="home__pricing-card">
                            <div className="home__pricing-card__header">
                                <h3 className="home__pricing-card__header-h3">
                                    One Time Payment. Lifetime Access.
                                </h3>
                                <p className="home__pricing-card__header-p">
                                    {sponsorCount ? sponsorCount :
                                        150}+ Sponsors
                                </p>
                            </div>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Access our growing database of high-quality newsletter sponsors
                            </p>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Sort sponsors by audience size, market type, or date added to find the perfect match for your newsletter
                            </p>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Updated daily with new sponsorship opportunities
                            </p>
                            <p className="home__pricing-card__text">
                                <FontAwesomeIcon icon={faCheckCircle} />&nbsp; Easily download the database into a CSV file.
                            </p>
                            <button className="btn home__pricing-card__btn" onClick={() => {
                                handlePurchase(purchased);
                            }}>
                                $64.99 -- Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default Subscribe;
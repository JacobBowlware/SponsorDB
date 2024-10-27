import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";


// Stripe
import { loadStripe } from '@stripe/stripe-js';

const stripeAPIKey = "pk_live_51MpGntBKPgChhmNg9wLgFqQICAjXSVAzaEMRKwXjuLQeZZhwghaiA7VDoG0Cov9uEnDGF9RlAKQkQ1xXPSooAX8D00Mp9uCFyO";
const stripeAPIKeyTest = "pk_test_51MpGntBKPgChhmNg63yLnqWVTfzn82jI0aEnzjwvRsTz1tFfUjDnWyMCOXTFuzY4P3QdmRINR04vxOm2pD4vQhyt000Bqbmgv3";
const stripePromise = loadStripe(stripeAPIKeyTest);

const handleSubscribe = async (tier: number, isSubscribed: boolean) => {
    // Tier 1 = Monthly
    // Tier 2 = Yearly

    // If user is already subscribed, send them to sponsors page
    if (isSubscribed) {
        window.location.href = "/sponsors";
        return;
    }

    // Redirect to signup page if user is not logged in
    if (!localStorage.getItem('token')) {
        window.location.href = "/signup/";
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

interface PricingProps {
    isSubscribed: boolean;
    subscribePage?: boolean;
}

const Pricing = ({ isSubscribed, subscribePage }: PricingProps) => {
    return <div className="web-section__container-center web-section-content" id="subscribe">
        <h2 className="subscribe__header">
            {subscribePage ? "Subscribe to SponsorDB" : "Pricing"}
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
                    <button disabled={isSubscribed} onClick={() => { handleSubscribe(1, isSubscribed); }}
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
                    <button disabled={isSubscribed} onClick={() => handleSubscribe(2, isSubscribed)} className="btn subscribe__btn ">
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
        <p className="airtable-p airtable-note subscribe-note">
            All payments are processed & secured by Stripe
        </p>
    </div>;
}

export default Pricing;
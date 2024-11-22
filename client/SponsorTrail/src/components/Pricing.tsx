import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faCheckCircle, faClock, faCrown, faEarthAmericas, faGem, faLeaf, faPiggyBank, faRocket, faStar } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";


// Stripe
import { loadStripe } from '@stripe/stripe-js';
import PricingCard from "./PricingCard";

const stripeAPIKey = "pk_live_51MpGntBKPgChhmNg9wLgFqQICAjXSVAzaEMRKwXjuLQeZZhwghaiA7VDoG0Cov9uEnDGF9RlAKQkQ1xXPSooAX8D00Mp9uCFyO";
const stripeAPIKeyTest = "pk_test_51MpGntBKPgChhmNg63yLnqWVTfzn82jI0aEnzjwvRsTz1tFfUjDnWyMCOXTFuzY4P3QdmRINR04vxOm2pD4vQhyt000Bqbmgv3";
const stripePromise = loadStripe(stripeAPIKey);

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
        <h2 className={"subscribe__header mb-2 " + (subscribePage ? 'authed_subscribe-header' : '')}>
            Choose Your Plan
        </h2>
        <div className={"subscribe__card-cont " + (subscribePage ? 'authed_subcribe-cont' : '')}>
            <PricingCard
                header="Monthly"
                text={["Unlimited access to our database of high-quality newsletter sponsors."]}
                price="$30"
                icon={faEarthAmericas}
                handleSubscribe={() => handleSubscribe(1, isSubscribed)}
            />
            <PricingCard
                header="Yearly"
                text={["Unlimited access to our database of high-quality newsletter sponsors.", "3 Free Months -- Save $90"]}
                price="$270"
                year={true}
                icon={faRocket}
                handleSubscribe={() => handleSubscribe(2, isSubscribed)}
            />
        </div>
        <p className="subscribe-note clearfix">
            All payments are processed & secured by Stripe
        </p>
    </div>;
}

export default Pricing;
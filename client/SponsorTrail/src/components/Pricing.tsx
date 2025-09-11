import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAward, faBookmark, faCalendarDay, faCheckCircle, faClock, faCrown, faCube, faCubes, faEarthAmericas, faGem, faLeaf, faPiggyBank, faRocket, faRotateRight, faStar, faTag, faTree } from "@fortawesome/free-solid-svg-icons";
import config from "../config";
import axios from "axios";


// Stripe
import { loadStripe } from '@stripe/stripe-js';
import PricingCard from "./PricingCard";

const stripeAPIKey = "pk_live_51MpGntBKPgChhmNg9wLgFqQICAjXSVAzaEMRKwXjuLQeZZhwghaiA7VDoG0Cov9uEnDGF9RlAKQkQ1xXPSooAX8D00Mp9uCFyO";
const stripeAPIKeyTest = "pk_test_51MpGntBKPgChhmNg63yLnqWVTfzn82jI0aEnzjwvRsTz1tFfUjDnWyMCOXTFuzY4P3QdmRINR04vxOm2pD4vQhyt000Bqbmgv3";
const stripePromise = loadStripe(stripeAPIKey);

const handlePurchase = async (plan: string, isSubscribed: boolean) => {
    // Redirect to signup page if user is not logged in
    if (!localStorage.getItem('token')) {
        window.location.href = "/signup/";
        return;
    }

    // If user is already subscribed, send them to sponsors page
    if (isSubscribed) {
        window.location.href = "/sponsors";
        return;
    }

    // Create checkout session for the selected plan
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Please log in to continue");
            return;
        }

        const response = await axios.post(`${config.backendUrl}users/checkout`, {
            plan: plan
        }, {
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
        alert("Error creating checkout session. Please try again.");
    }
}

interface PricingProps {
    isSubscribed: boolean;
    subscribePage?: boolean;
}

const Pricing = ({ isSubscribed, subscribePage }: PricingProps) => {
    return <div className="web-section__container-center web-section-content" id="subscribe">
        <h2 className={"subscribe__header align-left" + (subscribePage ? 'authed_subscribe-header' : '')}>
            Choose Your Plan
        </h2>
        <div className="subscribe__card-cont authed_subcribe-cont">
            <PricingCard
                header="Basic"
                text={[
                    "Access to 300+ verified sponsors",
                    "Basic email templates",
                    "Sponsor search and filtering",
                    "Unlimited outreach emails",
                    "Basic analytics dashboard"
                ]}
                price="$29"
                icon={faStar}
                handlePurchase={() => handlePurchase('basic', isSubscribed)}
            />
            <PricingCard
                header="Pro"
                text={[
                    "Everything in Basic",
                    "AI-powered sponsor matching",
                    "Custom email template generator",
                    "Advanced response rate analytics",
                    "Priority sponsor verification",
                    "AI assistant for outreach optimization",
                    "Revenue tracking and ROI metrics"
                ]}
                price="$79"
                icon={faCrown}
                handlePurchase={() => handlePurchase('pro', isSubscribed)}
            />
        </div>
        <p className="subscribe-note clearfix">
            All payments are processed & secured by Stripe
        </p>
    </div>;
}

export { Pricing, handlePurchase };
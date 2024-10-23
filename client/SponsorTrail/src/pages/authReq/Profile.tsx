import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';

interface ProfileProps {
    userEmail: string,
    userSubscribed: boolean,
    currentPeriodEnd: number,
    subscriptionPlan: string,
    stripeCustomerId: string
}

const stripeAPIKey = "pk_test_51MpGntBKPgChhmNg63yLnqWVTfzn82jI0aEnzjwvRsTz1tFfUjDnWyMCOXTFuzY4P3QdmRINR04vxOm2pD4vQhyt000Bqbmgv3";
const stripePromise = loadStripe(stripeAPIKey);

const Profile = ({ userEmail, userSubscribed, currentPeriodEnd, subscriptionPlan, stripeCustomerId }: ProfileProps) => {
    const handleSubscribe = async (tier: number) => {
        // Tier 1 = Monthly
        // Tier 2 = Yearly

        try {
            const response = await axios.post(`${config.backendUrl}users/checkout`, { tier: tier },
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                });

            console.log(response.data);
            const sessionId = response.data.sessionId;

            const stripe = await stripePromise;

            await stripe?.redirectToCheckout({
                sessionId: sessionId
            });

        } catch (error) {
            console.log("Error subscribing", error);
        }
    }

    const handleSubscriptionInfo = async () => {
        try {

            // TEST_LINK for Stripe billing portal: https://billing.stripe.com/p/login/test_14k16G34K17Ycta000


        }
        catch (e) {
            console.log("Error getting subscription info", e);
        }
    }

    return (
        <div className="web-page profile">
            <div className="web-section profile" id="">
                <div className="profile-cont">
                    <div className="profile-cont__card">
                        <h1 className="profile-cont__card-header">
                            Profile Information
                        </h1>
                        <div className="profile-cont__card-info">
                            <div className="profile-cont__card-info-options">
                                <p className="profile-cont__card-info-item profile-cont__card-info-item__value mt-0">
                                    Email:   {userEmail}
                                </p>
                                <p className="profile-cont__card-info-item profile-cont__card-info-item__value">
                                    Subscription Plan: {userSubscribed ? subscriptionPlan : "Not Subscribed"}
                                </p>
                                <p className="profile-cont__card-info-item profile-cont__card-info-item__value">
                                    Renewal Date: {currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toLocaleDateString() : 'N/A'}
                                </p>
                                <Link className="btn profile-cont__card-form__btn mt-2" to="https://billing.stripe.com/p/login/28obKyanW7Rv9205kk">
                                    Subscription Info
                                </Link>
                                <Link className="btn profile-cont__card-form__btn mt-2 ml-2" to="/change-password">
                                    Change Password
                                </Link>
                                <p className="airtable-p airtable-note mt-1">
                                    All payments are processed & secured by Stripe. We do not store any payment information.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
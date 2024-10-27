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
    cancelAtPeriodEnd: boolean
}

const Profile = ({ userEmail, userSubscribed, currentPeriodEnd, subscriptionPlan, cancelAtPeriodEnd }: ProfileProps) => {

    const handleBillingPortal = async () => {
        try {

            // Get the billing portal link
            const response = await axios.get(`${config.backendUrl}users/customer-portal`, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            });
            const { url } = response.data;

            // Redirect to billing portal
            window.open(url, '_blank');
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
                                    Email:   <span className="text-italic">{userEmail ? userEmail : "..."} </span>
                                </p>
                                <p className="profile-cont__card-info-item profile-cont__card-info-item__value">
                                    Subscription Plan: <span className="text-italic">{userSubscribed ? subscriptionPlan : "Not Subscribed"}</span> {cancelAtPeriodEnd ? <span className="text-italic"> (Canceling at the end of the period)</span> : ""}
                                </p>
                                <p className="profile-cont__card-info-item profile-cont__card-info-item__value">
                                    Renewal Date: <span className="text-italic">{currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toLocaleDateString() : 'N/A'}</span>
                                </p>
                                <div className="profile-cont__card-form__btn-cont">
                                    <button className="btn profile-cont__card-form__btn mt-2" onClick={() => handleBillingPortal()}>
                                        Subscription Info
                                    </button>
                                    <Link className="btn profile-cont__card-form__btn mt-2" to="/change-password">
                                        Change Password
                                    </Link>
                                </div>
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
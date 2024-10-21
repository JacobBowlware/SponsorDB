import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import config from '../../config';
import { subscribe } from "diagnostics_channel";

interface ProfileProps {
    userEmail: string,
    userSubscribed: boolean
}

const Profile = ({ userEmail, userSubscribed }: ProfileProps) => {
    const [user, setUser] = useState({
        email: "loading..."
    });

    const [error, setError] = useState("");

    const getUserProfile = async () => {
        await axios.get(`${config.backendUrl}users/me`, {
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        }).then((res) => {
            setUser(res.data);
        }).catch((err) => {
            setUser({ email: "An error occured..." });
        })
    }

    const handleSubscribe = async (tier: number) => {
        // Tier 1 = Monthly
        // Tier 2 = Yearly

        try {
            await axios.post(`${config.backendUrl}subscribe`, {
                tier: tier
            }, {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            }).then((res) => {
                console.log("Subscribed", res);
                // window.location.reload();
                // window.location.href = "/sponsors"
            })

        } catch (error) {
            console.log("Error subscribing", error);
            setError("An error occurred, please try again.");
        }
    }

    useEffect(() => {
        if (userEmail !== "") {
            setUser({ email: userEmail });
        }
        else {
            getUserProfile();
        }
    }, [user.email, userEmail])


    return (
        <div className="web-page profile">
            <div className="web-section profile" id="">
                <div className="profile-cont">
                    <div className="profile-cont__card">
                        <h1 className="profile-cont__card-header">
                            Profile
                        </h1>
                        <div className="profile-cont__card-info">
                            <div className="profile-cont__card-info-options">
                                <p className="profile-cont__card-info-item">
                                    Email: <span className="profile-cont__card-info-item__value">  {user.email}</span>
                                </p>
                                <Link className="btn profile-cont__card-form__btn" to="/change-password">
                                    Change Password
                                </Link>
                                {!userSubscribed && <div className="profile-subscribe">
                                    <h2 className="profile-subscribe__header">
                                        Subscribe to SponsorDB
                                    </h2>
                                    <p className="profile-subscribe__header-note">
                                        Choose a plan below, cancel anytime. After subscribing, you will have full access to the database.
                                    </p>
                                    <div className="profile-subscribe__card-cont">
                                        <div className="profile-subscribe__card">
                                            <div className="profile-subscribe__card-text-cont">
                                                <h3 className="profile-subscribe__card-header">
                                                    Monthly <span className="profile-subscribed__card-header__note"> $20</span>
                                                </h3>
                                                <div className="profile-subscribe__card-body">
                                                    <p>
                                                        - Full access to the database
                                                    </p>
                                                    <p>
                                                        - Cancel anytime
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => { handleSubscribe(1); }}
                                                className="btn profile-subscribe__btn">
                                                Subscribe
                                            </button>
                                        </div>
                                        <div className="profile-subscribe__card">
                                            <div className="profile-subscribe__card-text-cont">
                                                <h3 className="profile-subscribe__card-header">
                                                    Yearly <span className="profile-subscribed__card-header__note"> $180</span>
                                                </h3>
                                                <div className="profile-subscribe__card-body">
                                                    <p>
                                                        - 25% off
                                                    </p>
                                                    <p>
                                                        - Full access to the database
                                                    </p>
                                                    <p>
                                                        - Cancel anytime
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleSubscribe(2)} className="btn profile-subscribe__btn ">
                                                Subscribe
                                            </button>
                                        </div>
                                    </div>
                                </div>}
                                {
                                    userSubscribed && <div className="profile-subscribe">
                                        <h2 className="profile-subscribe__header">
                                            Subscription
                                        </h2>
                                        <p className="profile-subscribe__header-note">
                                            You are currently subscribed to SponsorDB!
                                        </p>
                                        <p className="profile-subscribe__header-note">
                                            To cancel your subscription, click the button below and follow the instructions.
                                        </p>
                                        <button className="btn profile-cont__card-form__btn mb-3">
                                            Cancel Subscription
                                        </button>
                                    </div>
                                }
                                <p className="airtable-p airtable-note">
                                    All payments are secured & processed by Stripe. We do not store any payment information.
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
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLink, faLock, faUser } from "@fortawesome/free-solid-svg-icons";

interface ProfileProps {
    userEmail: string,
    purchased: boolean,
}

const Profile = ({ userEmail, purchased }: ProfileProps) => {
    const [noStripeInfo, setNoStripeInfo] = useState(false);

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
        catch (e: any) {
            console.log("Error getting subscription info", e);
            if (e.response.data && e.response.data == "User has no subscription info") {
                setNoStripeInfo(true);
            }
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
                                    Database: <span className="text-italic">{purchased ? "Purchased" : "Not Purchased"}</span>
                                </p>
                                {/* <p className="profile-cont__card-info-item profile-cont__card-info-item__value">
                                    Renewal Date: <span className="text-italic">{currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toLocaleDateString() : 'N/A'}</span>
                                </p> */}
                                <div className="profile-cont__card-form__btn-cont">
                                    {/* <button className="btn profile-cont__card-form__btn" onClick={() => handleBillingPortal()}>
                                        Subscription Info <FontAwesomeIcon icon={faExternalLink} />
                                    </button> */}
                                    <Link className="btn profile-cont__card-form__btn" to="/change-password">
                                        Change Password <FontAwesomeIcon icon={faLock
                                        } />
                                    </Link>
                                    <button className="btn profile-cont__card-form__btn" onClick={() => {
                                        localStorage.removeItem('token');
                                        window.location.reload();
                                    }}>
                                        Logout <FontAwesomeIcon icon={faUser} />
                                    </button>
                                </div>
                                <p className="profile-note">
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
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import config from '../../config';

interface ProfileProps {
    userEmail: string
}

const Profile = ({ userEmail }: ProfileProps) => {
    const [user, setUser] = useState({
        email: "loading..."
    });

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

    useEffect(() => {
        if (userEmail !== "") {
            setUser({ email: userEmail });
        }
        else {
            getUserProfile();
        }
    }, [user.email, userEmail])

    return (
        <div className="web-page">
            <div className="web-section profile" id="">
                <div className="profile-cont">
                    <div className="profile-cont__card">
                        <h1 className="profile-cont__card-header">
                            Profile Information
                        </h1>
                        <div className="profile-cont__card-info">
                            <div className="profile-cont__card-info-options">
                                <p className="profile-cont__card-info-item">
                                    Email: <span className="profile-cont__card-info-item__value">  {user.email}</span>
                                </p>
                                <Link className="btn profile-cont__card-form__btn" to="/change-password">
                                    Change Password
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Profile = () => {
    const [user, setUser] = useState({
        email: ""
    });

    const getUserProfile = async () => {
        // Get user profile information
        await axios.get('http://localhost:3001/api/users/me', {
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        }).then((res) => {
            setUser(res.data);
        }).catch((err) => {
            console.log(err);
        })
    }

    useEffect(() => {
        if (user.email === "") {
            getUserProfile();
        }
    }, [user.email])

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
                                    Email: <span className="profile-cont__card-info-item__value">  {user.email ? user.email : "An error occured..."}</span>
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
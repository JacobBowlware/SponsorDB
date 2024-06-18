import { Link } from "react-router-dom";

const Profile = () => {
    return (
        <div className="web-page">
            <div className="web-section profile" id="">
                <div className="profile-cont">
                    <div className="profile-cont__card">
                        <h1 className="profile-cont__card-header">
                            Profile Information
                        </h1>
                        <div className="profile-cont__card-info">
                            <p className="profile-cont__card-info-item">
                                Email: <span className="profile-cont__card-info-item__value"> example@gmail.com </span>
                            </p>
                            <Link to="/auth/change-password">
                                Change Password
                            </Link>
                            <Link to="/auth/change-password">
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
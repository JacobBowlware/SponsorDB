// React & Firebase
import { useState } from "react";

// Other
import config from "../config";

// Components
import LoadingBtn from "../components/common/LoadingBtn";
import axios from "axios";

// Font Awesome Icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

interface ReviewProps {
    email: string;
}

const Review = ({ email }: ReviewProps) => {
    const [name, setName] = useState('');
    const [typedEmail, setTypedEmail] = useState(email ? email : '');
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [userReviewSubmitted, setUserReviewSubmitted] = useState(false);
    const [userError, setUserError] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setUserError(false);
        setUserReviewSubmitted(false);

        setLoading(true);
        try {
            await axios.post(`${config.backendUrl}users/feedback`, {
                email: typedEmail,
                message: review,
                name: name
            },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

            setUserReviewSubmitted(true);
            setLoading(false);
            setTimeout(() => {
                window.location.reload();
            }, 5000)

        } catch (error) {
            setUserError(true);
            setLoading(false);
            console.log(error)
        }
    }

    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0">
                <div className="web-section__container web-section-content">
                    <div className="review-container">
                        <div className="review-header">
                            <h1 className="review-title">Share Your Experience</h1>
                            <p className="review-subtitle">
                                Help us improve SponsorTrail by sharing your feedback, suggestions, or questions. 
                                We value your input and will get back to you as soon as possible.
                            </p>
                        </div>

                        <div className="review-content">
                            <div className="review-card">
                                <form className="review-form" onSubmit={(e) => handleSubmit(e)}>
                                    <div className="form-field">
                                        <label className="form-label">Name</label>
                                        <input 
                                            id='name-input' 
                                            className="input" 
                                            type="text" 
                                            placeholder="Enter your name" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)} 
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <label className="form-label">Email *</label>
                                        <input 
                                            value={typedEmail} 
                                            required={true} 
                                            id='email-input' 
                                            className="input" 
                                            type="email" 
                                            placeholder="Enter your email address" 
                                            onChange={(e) => setTypedEmail(e.target.value)} 
                                        />
                                    </div>
                                    
                                    <div className="form-field">
                                        <label className="form-label">Message *</label>
                                        <textarea 
                                            required={true} 
                                            id='review-input' 
                                            className="input form-textarea" 
                                            rows={6} 
                                            placeholder="Tell us about your experience with SponsorTrail, suggestions for improvement, or any questions you have..." 
                                            value={review}
                                            onChange={(e) => setReview(e.target.value)} 
                                        />
                                    </div>
                                    
                                    <div className="form-actions">
                                        <LoadingBtn loading={loading} title="Submit Feedback" />
                                        {userReviewSubmitted && (
                                            <div className="form-message form-message--success">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                Thank you for your feedback! We'll review it and get back to you soon.
                                            </div>
                                        )}
                                        {userError && (
                                            <div className="form-message form-message--error">
                                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                                There was an error submitting your feedback. Please try again later.
                                            </div>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Review;
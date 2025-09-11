// React & Firebase
import { useState } from "react";

// Other
import config from "../config";

// Components
import LoadingBtn from "../components/common/LoadingBtn";
import axios from "axios";

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
        <div className="review-page">
            <div className="review-header">
                <h1>User Feedback</h1>
                <p>Have feedback, suggestions, or questions? We'd love to hear from you! Please fill out the form below and we'll get back to you as soon as possible.</p>
            </div>

            <div className="review-content">
                <div className="review-section">
                    <form className="review-form" onSubmit={(e) => handleSubmit(e)}>
                        <div className="form-field">
                            <label className="form-label">Name</label>
                            <input 
                                id='name-input' 
                                className="form-input" 
                                type="text" 
                                placeholder="Enter your name" 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                        
                        <div className="form-field">
                            <label className="form-label">Email *</label>
                            <input 
                                value={typedEmail} 
                                required={true} 
                                id='email-input' 
                                className="form-input" 
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
                                className="form-input form-textarea" 
                                rows={5} 
                                placeholder="Write your message..." 
                                onChange={(e) => setReview(e.target.value)} 
                            />
                        </div>
                        
                        <div className="form-actions">
                            <LoadingBtn loading={loading} title="Submit Feedback" />
                            {userReviewSubmitted && <p className="form-message form-message--success">Thank you for your feedback!</p>}
                            {userError && <p className="form-message form-message--error">There was an error submitting your feedback. Please try again later.</p>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Review;
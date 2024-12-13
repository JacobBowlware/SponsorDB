// React & Firebase
import { useState } from "react";

// Other
import config from "../../config";

// Components
import LoadingBtn from "../../components/common/LoadingBtn";
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
        <div className="web-page review">
            <div className="web-section all-blogs web-section-content" id="review">
                <div className="web-section__container review-container">
                    <h1 className="review-header">
                        Customer Feedback
                    </h1>
                    <p className="review-text">
                        We'd love to hear your feedback! Please fill out the form below to submit a review.
                    </p>
                    <form className="review-form" onSubmit={(e) => handleSubmit(e)}>
                        <h2 className="review-form-label">Name</h2>
                        <input id='name-input' className="home__container-item__input review-input" type="text" placeholder="Enter your full name" onChange={(e) => setName(e.target.value)} />
                        <h2 className="review-form-label">Email *</h2>
                        <input value={typedEmail} required={true} id='name-input' className="home__container-item__input review-input" type="email" placeholder="Enter your email address" onChange={(e) => setTypedEmail(e.target.value)} />
                        <h2 className="review-form-label">Message *</h2>
                        <textarea required={true} id='review-input' className="home__container-item__input review-input" rows={5} placeholder="Write your message..." onChange={(e) => setReview(e.target.value)} />
                        <LoadingBtn loading={loading} title="Submit Feedback" />
                        {userReviewSubmitted && <p className="home__container-item__form-thanks">Thank you for your review!</p>}
                        {userError && <p className="home__container-item__form-thanks">There was an error submitting your review. Please try again later.</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Review;
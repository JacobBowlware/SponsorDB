import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarHollow } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

/* 
TODO:
- Add Firebase integration
- Add form validation
- Add error handling
- Add loading animation
- If user clicks on the stars/rating message, it should select the radio button.
- Convert radio elements to a reusable component
*/
const Review = () => {
    const [name, setName] = useState('');
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [userReviewSubmitted, setUserReviewSubmitted] = useState(false);

    const handleSubmit = (e: any) => {
        e.preventDefault();

        // Submit Review to Firebase
        setLoading(true);


        // Depending on the result of the submission, display a message to the user
        setUserReviewSubmitted(true);
        setLoading(false);
        console.log(name, review);

        // Refresh the page
        setTimeout(() => {
            window.location.reload();
        }, 5000)
    }

    return (
        <div className="web-page">
            <div className="web-section all-blogs web-section-content" id="review">
                <div className="web-section__container review-container">
                    <h1 className="review-header">Write a Review </h1>
                    <form className="review-form" onSubmit={(e) => handleSubmit(e)}>
                        <h2 className="review-form-label">Name (optional):</h2>
                        <input id='name-input' className="home__container-item__input review-input" type="text" onChange={(e) => setName(e.target.value)} />
                        <h2 className="review-form-label">Rate:</h2>
                        <div id="rating" className="review-form-radio">
                            <div>
                                <input className="review-form-input" type="radio" name="rating" id="rating-1" value="1" /> {[...Array(5)].map((star, i) => {
                                    return <FontAwesomeIcon icon={faStar} className="review-form-star" key={i} />
                                })} Excellent
                            </div>
                            <div>
                                <input className="review-form-input" type="radio" name="rating" id="rating-2" value="2" /> {[...Array(5)].map((star, i) => {
                                    if (i > 3) {
                                        return <FontAwesomeIcon icon={faStarHollow} className="review-form-star" key={i} />
                                    }
                                    return <FontAwesomeIcon icon={faStar} className="review-form-star" key={i} />
                                })} Great
                            </div>
                            <div>
                                <input className="review-form-input" type="radio" name="rating" id="rating-3" value="3" /> {[...Array(5)].map((star, i) => {
                                    if (i > 2) {
                                        return <FontAwesomeIcon icon={faStarHollow} className="review-form-star" key={i} />
                                    }
                                    return <FontAwesomeIcon icon={faStar} className="review-form-star" key={i} />
                                })} Good
                            </div>
                            <div>
                                <input className="review-form-input" type="radio" name="rating" id="rating-4" value="4" /> {[...Array(5)].map((star, i) => {
                                    if (i > 1) {
                                        return <FontAwesomeIcon icon={faStarHollow} className="review-form-star" key={i} />
                                    }
                                    return <FontAwesomeIcon icon={faStar} className="review-form-star" key={i} />
                                })} Okay
                            </div>
                            <div>
                                <input className="review-form-input" type="radio" name="rating" id="rating-5" value="5" /> {[...Array(5)].map((star, i) => {
                                    if (i > 0) {
                                        return <FontAwesomeIcon icon={faStarHollow} className="review-form-star" key={i} />
                                    }
                                    return <FontAwesomeIcon icon={faStar} className="review-form-star" key={i} />
                                })} Bad
                            </div>
                        </div>
                        <h2 className="review-form-label">Review:</h2>
                        <textarea id='review-input' className="home__container-item__input review-input" rows={5} placeholder="" onChange={(e) => setReview(e.target.value)} />
                        <button id='review-btn' className="home__container-item__btn review-btn" type="submit">Submit</button>
                        {userReviewSubmitted && <p className="home__container-item__form-thanks">Thank you for leaving a review, we appreciate your feedback and
                            will use it to improve SponsorTrail for our users!
                        </p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Review;
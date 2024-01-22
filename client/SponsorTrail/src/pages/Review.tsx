// React & Firebase
import { useState } from "react";
import { getFirestore, addDoc, collection } from "@firebase/firestore";
import { app } from "../firebase/config";

// Font Awesome
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faStarHollow } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Components
import LoadingBtn from "../components/common/LoadingBtn";

/* 
TODO:
- Add Firebase integration - DONE
- Add error handling - DONE
- Add loading animation - DONE
- Add form validation
- If user clicks on the stars/rating message, it should select the radio button.
- Convert radio elements to a reusable component
*/

const db = getFirestore(app);
const Review = () => {
    const [name, setName] = useState('');
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
            const docRef = collection(db, "reviews");
            await addDoc(docRef, {
                name: name === '' ? 'Anonymous' : name,
                review: review
            });

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
                        <LoadingBtn loading={loading} title="Submit" />
                        {userReviewSubmitted && <p className="home__container-item__form-thanks">Thank you for leaving a review, we appreciate your feedback and
                            will use it to improve SponsorTrail for our users!
                        </p>}
                        {userError && <p className="home__container-item__form-thanks">There was an error submitting your review. Please try again later.</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Review;
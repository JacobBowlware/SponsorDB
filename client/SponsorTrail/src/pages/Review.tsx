// React & Firebase
import { useState } from "react";
import { getFirestore, addDoc, collection } from "@firebase/firestore";
import { app } from "../firebase/config";

// Components
import LoadingBtn from "../components/common/LoadingBtn";

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
                    <h1 className="review-header">
                        We appreciate your feedback!
                    </h1>
                    <form className="review-form" onSubmit={(e) => handleSubmit(e)}>
                        <h2 className="review-form-label">Name (optional):</h2>
                        <input id='name-input' className="home__container-item__input review-input" type="text" onChange={(e) => setName(e.target.value)} />
                        <h2 className="review-form-label">Review:</h2>
                        <textarea id='review-input' className="home__container-item__input review-input" rows={5} placeholder="" onChange={(e) => setReview(e.target.value)} />
                        <LoadingBtn loading={loading} title="Submit" />
                        {userReviewSubmitted && <p className="home__container-item__form-thanks">Thank you for your review!</p>}
                        {userError && <p className="home__container-item__form-thanks">There was an error submitting your review. Please try again later.</p>}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Review;
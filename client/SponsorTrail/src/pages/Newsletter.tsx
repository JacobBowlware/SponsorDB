import { faArrowRight, faCalendarDays, faCheckCircle, faCircleCheck, faClock, faGift, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

const Newsletter = () => {
    const [newsletterPosts, setNewsletterPosts] = useState([
        {
            "title": "SponsorDB: Easily Find Your Next Newsletter Sponsor",
            "text": "Access our curated list of proven newsletter sponsors, so you can spend less time searching and more time growing your newsletter. High quality sponsors with proven track records, updated regularly.",
            "link": "https://open.substack.com/pub/sponsordb/p/sponsordb-easily-find-your-next-newsletter?r=52fi78&utm_campaign=post&utm_medium=web"
        }
    ]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();

    }
    return (
        <div className="web-page">
            <div className="login-container newsletter-container">
                <form className="login-form newsletter-form__container" onSubmit={(e) => { handleSubmit(e) }}>
                    <div className="login-form__header-cont newsletter-text-cont">
                        <h1 className="login-form__header newsletter-form__header">
                            Get the Latest Sponsors Delivered Straight to Your Inbox
                        </h1>
                        <p className="newsletter-form__p">
                            <FontAwesomeIcon icon={faCircleCheck} />&nbsp; Every Monday, you’ll receive the latest sponsors, top industry insights, and exclusive opportunities—all in one place.
                        </p>
                        <p className="newsletter-form__p">
                            <FontAwesomeIcon icon={faCircleCheck} />&nbsp; No spam or junk mail, just proven Newsletter Sponsors.
                        </p>
                        <a href="https://sponsordb.substack.com/subscribe" target="_blank" rel="noreferrer" className="btn login-form__btn mt-2 newsletter-form__btn">
                            Subscribe Now <FontAwesomeIcon icon={faArrowRight} />
                        </a>
                    </div>
                    <div className="newsletter-posts-cont">
                        <h2 className="newsletter-posts__header">
                            Some of our Recent Posts
                        </h2>
                        <div className="newsletter-posts">
                            {newsletterPosts.map((
                                post: {
                                    title: string,
                                    text: string,
                                    link: string
                                }, index: number) => {
                                return <div className="newsletter-post">
                                    <div className="newsletter-post__header-cont">
                                        <h3 className="newsletter-post__header">
                                            {post.title}
                                        </h3>
                                        <p className="newsletter-post__text">
                                            {post.text}
                                        </p>
                                    </div>
                                    <a className="newsletter-post__link" href={post.link} target="_blank" rel="noreferrer">
                                        Read More <FontAwesomeIcon icon={faArrowRight} />
                                    </a>
                                </div>
                            })}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Newsletter;
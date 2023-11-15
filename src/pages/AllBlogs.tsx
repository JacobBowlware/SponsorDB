import ReachingOut from "./blogs/ReachingOut";
import AllBlogsItem from "../components/AllBlogsItem";

const blogList = [
    ReachingOut
]

const AllBlogs = () => {
    return (
        <div className="web-page">
            <div className="web-section all-blogs web-section-content" id="all-blogs">
                <div className="web-section__container all-blogs__container">
                    <AllBlogsItem title="How to Reach Out for Podcast Sponsorships: Mastering the First Contact" body="Welcome to our guide on mastering the art of reaching out for podcast sponsorships! As a podcaster, the hunt for suitable sponsors to elevate your content and boost revenue can be an exciting yet challenging endeavor. The initial step, that first contact, serves as the cornerstone of this journey towards successful partnerships..." link="/blogs/reaching-out" />
                </div>
            </div>
        </div>
    );
}

export default AllBlogs;
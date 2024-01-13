import AllBlogsItem from "../components/AllBlogsItem";

const AllBlogs = () => {
    return (
        <div className="web-page">
            <div className="web-section all-blogs web-section-content" id="all-blogs">
                <div className="web-section__container all-blogs__container">
                    <AllBlogsItem title="5 Tips for Reaching Out to Sponsors" body="Learn essential tips for initiating conversations with potential sponsors to elevate your podcast's content and revenue. Craft compelling messages that set the stage for successful partnerships." link="/blogs/5-tips-reaching-out/" />
                    <AllBlogsItem title="The Role of Podcast Sponsors" body="Understanding the role of a podcast sponsor is key to leveraging their potential benefits for your podcast. What exactly defines a podcast sponsor, and how do they contribute to your podcast’s success?" link="/blogs/the-role-of-podcast-sponsors/" />
                </div>
            </div>
        </div>
    );
}

export default AllBlogs;
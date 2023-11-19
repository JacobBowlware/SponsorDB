import AllBlogsItem from "../components/AllBlogsItem";

const AllBlogs = () => {
    return (
        <div className="web-page">
            <div className="web-section all-blogs web-section-content" id="all-blogs">
                <div className="web-section__container all-blogs__container">
                    <AllBlogsItem title="5 Tips for Reaching Out to Sponsors" body="Learn essential tips for initiating conversations with potential sponsors to elevate your podcast's content and revenue. Craft compelling messages that set the stage for successful partnerships." link="/blogs/5-tips-reaching-out" />
                    <AllBlogsItem title="Choosing the Right Sponsor" body="Navigate the maze of potential sponsors to select the ideal partner for your podcast. Align your content and revenue goals with suitable sponsorships." link="/blogs/right-sponsor" />
                    <AllBlogsItem title="Crafting an Effective Sponsorship Pitch" body="Discover the art of reaching out for podcast sponsorships. Learn the cornerstone strategies for successful partnerships." link="/blogs/effective-pitch" />
                </div>
            </div>
        </div>
    );
}

export default AllBlogs;
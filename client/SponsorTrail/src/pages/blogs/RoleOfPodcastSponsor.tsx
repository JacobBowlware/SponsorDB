import { Link } from "react-router-dom";
import SponsorHelp from "../../components/SponsorHelp";

interface Props {
    sponsorCount: number;
    companyCount: number;
    emailCount: number;
}

const RoleOfPodcastSponsor = ({ sponsorCount, companyCount, emailCount }: Props) => {
    return (
        <div className="web-page blog-container">
            <div className="web-section">
                <div className="web-section__container web-section-content blog">
                    <h1>The Role of Podcast Sponsors</h1>
                    <p className="blog-desc">
                        Understanding the role of a podcast sponsor is key to leveraging their potential benefits for your podcast. What exactly defines a podcast sponsor, and how do they contribute to your podcast’s success? This blog aims to demystify the concept of podcast sponsorship, exploring their significance and practical implications.
                    </p>
                    <h2>What Is a Podcast Sponsor?</h2>
                    <p>
                        A podcast sponsor is a brand that will pay a podcast (money, merchandise, etc.) in return for their product and or pitch to be advertised to the podcast's viewers. The amount a sponsor is willing to pay depends on the size of the podcast's viewership. The following displays the industry average podcast advertising rate (updated January 2024):
                    </p>
                    <p className="blog-note">
                        Note: CPM is cost per mille, or cost per 1,000 listeners.
                    </p>
                    <table className="blog-table">
                        <tr>
                            <th>30-second Ad CPM <a href="#reference-1">[1]</a></th>
                            <th>60-second Ad CPM</th>
                        </tr>
                        <tr>
                            <td>$18</td>
                            <td>$25</td>
                        </tr>
                    </table>
                    <h2>Common Forms of Advertisements</h2>
                    <p>
                        Some common ways a sponsor may ask a podcast to advertise their product includes:
                    </p>
                    <ul>
                        <li>URL Mentions (Directing listeners to a specific URL associated with the sponsor for more information or offers)</li>
                        <li>Scripted Ads</li>
                        <li>Native Integrations (Seamlessly integrating the product or service into the podcast's content or discussions)</li>
                        <li>Branded Segments</li>
                    </ul>
                    <h2>Why Sponsors are Vital for Podcasts</h2>
                    <p>
                        Sponsors are vital to podcasts for many reasons. Mainly, the financial gain they can provide. Operating a profitable podcast can be a difficult task, and having these sponsors can really make a difference. Sponsors will also benefit podcasts viewers; they get to learn about brands that align with their interests, and usually they are given a discount code or voucher to use at checkout -if they desire to purchase from that brand. It is a win-win-win situation -the podcast, viewer, and sponsor all have something to gain.
                    </p>
                    <h2>Choosing the Right Sponsor for Your Podcast</h2>
                    <p>
                        When looking for podcast sponsors, it can be difficult to know where to start. Imagine your average viewer: what are their interests, where are they located, their gender, etc. Now, picture sponsors that you could genuinely imagine your viewers being interested in -those are the sponsors you should attempt to work with. For instance, if you run a podcast centered around wildlife exploration, looking towards technology companies for sponsorships is probably not a viable idea. Instead, this podcast may want to look towards brands which sell camping gear or heavy-duty outdoor clothing. Still, finding actual podcast sponsors can be hard. This is where we come in; SponsorTrail will send you lists of proven podcasts sponsors weekly, so all you have to do is reach out to them.
                    </p>
                    <SponsorHelp sponsorCount={sponsorCount} companyCount={companyCount} emailCount={emailCount} />
                    <h3 className="blog-reference-header">References</h3>
                    <ol className="blog-reference-list">
                        <li id="reference-1">
                            “Libsyn, ADVERTISECAST MARKETPLACE,” Jan 1, 2024. <a href="https://www.advertisecast.com/podcast-advertising-rates">https://www.advertisecast.com/podcast-advertising-rates</a>
                        </li>
                    </ol>
                    <h3>
                        Related Blogs:
                    </h3>
                    <ul>
                        <li><Link to="/blogs/5-tips-reaching-out">5 Tips for Reaching Out to Sponsors</Link></li>
                        <li><Link to="/blogs/data-driven-approach/">Navigating Podcast Sponsorships: A Data-Driven Approach</Link></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default RoleOfPodcastSponsor;
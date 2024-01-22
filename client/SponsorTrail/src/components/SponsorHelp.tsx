import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
    sponsorCount: number;
    companyCount: number;
    emailCount: number;
}

const SponsorHelp = ({ sponsorCount, companyCount, emailCount }: Props) => {
    // ({/* {sponsorCount} sponsorships, {companyCount} companies, {emailCount} email addresses} */})
    return (
        <>
            <h2>How Sponsor Trail Can Help
            </h2>
            <p>
                SponsorTrail is a service that helps podcasters find sponsors. Upon signing up, you will recieve full access to our data-base of sponsors , which is updated weekly (join waitlist for more information). Simply look through our list, find sponsors that align with your podcast, and reach out to them.
            </p>
            <a className="footer-item footer-item__highlight mt-2" href="/#hero">
                Join Waitlist&nbsp; <FontAwesomeIcon className="footer-item__highlight-arrow-icon" icon={faArrowRight} />
            </a>
        </>
    );
}

export default SponsorHelp;
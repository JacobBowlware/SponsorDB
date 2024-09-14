import { faArrowRight, faCheck, faMailForward, faMailReply, faMessage, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

/*
 ADMIN PAGE
 - This page allows for the admin to view all potential-sponsors found from our email scraping tool.
 - Sponsors with the 'Under Review' status will be displayed here.
 - ADMIN must approve or deny the sponsor before they are added to the sponsors database.
*/
const Admin = () => {
    const [sponsor, setSponsor] = useState("");
    const [sponsorLink, setSponsorLink] = useState("");
    const [newsletter, setNewsletter] = useState("");
    const [tags, setTags] = useState([""]);
    const [sponsors, setSponsors] = useState([
        {
            sponsor: "",
            sponsorLink: "",
            newsletter: "",
            tags: [""],
            emailLink: ""
        }
    ]);

    const handleApprove = async (e: any) => {
        e.preventDefault();
        console.log("Approve");
    }

    const handleDeny = async (e: any) => {
        e.preventDefault();

        let sponsorsCopy = [...sponsors];

        // Remove first element from sponsorsCopy
        sponsorsCopy.shift();
        setSponsors(sponsorsCopy);
    }

    useEffect(() => {
        // Call backend to get all sponsors with status 'Under Review'
        setSponsors([
            {
                sponsor: "Health Tech Solutions",
                sponsorLink: "https://www.example_sponsors-page.com",
                newsletter: "WeeklyTech",
                tags: ["Tech", "Health"],
                emailLink: "sponsorDBemails/this_sponsors-email.gmail.com"
            },
            {
                sponsor: "Northwest Finance",
                sponsorLink: "https://www.north-fin.com",
                newsletter: "FinanceWeekly",
                tags: ["Finance"],
                emailLink: "sponsorDBemails/other-sopnsorHERE.gmail.com"
            }
        ]);
    }, []);

    return (
        <div className="web-page">
            <div className="web-section admin" id="">
                <div className="admin-header__cont web-section-content">
                    <h1 className="admin-header">Admin Dashboard</h1>
                </div>
                <div className="admin-dash__cont">
                    <p className="admin-dash__text">
                        View all <strong>'Under Review'</strong> sponsors currently in the database.
                    </p>
                    <p className="admin-dash__text">
                        Fill in the fields with the correct information. <strong>Submit</strong> or <strong>Deny</strong> sponsors to add them to the database.
                    </p>
                    <form className="admin-dash__form">
                        <div className="admin-dash__form-header">
                            <p className="mb-0">
                                Newsletter Email: <a href={sponsors[0].emailLink} target="_blank" rel="noreferrer">{sponsors[0].emailLink}</a>
                            </p>
                            <button onClick={(e) => handleDeny(e)} className="btn admin-dash__form-btn admin-dash__form-btn-deny">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="admin-dash__sponsor-info">
                            <input placeholder="Sponsor" className="admin-dash__form-input" onChange={(e) => { setSponsor(e.target.value) }} />
                            <input placeholder="Sponsor Link" className="admin-dash__form-input" onChange={(e) => { setSponsorLink(e.target.value) }} />
                            <input placeholder="Newsletter Name" className="admin-dash__form-input" onChange={(e) => { setNewsletter(e.target.value) }} />
                            <input placeholder="tag1, tag2, etc" className="admin-dash__form-input" onChange={(e) => { setTags([e.target.value]) }} />
                        </div>
                        <div className="admin-dash__sponsor-approve">
                            <button disabled={!sponsor || !sponsorLink || !newsletter} onClick={(e) => handleApprove(e)} className="btn admin-dash__form-btn admin-dash__form-btn-approve">
                                Submit <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default Admin;
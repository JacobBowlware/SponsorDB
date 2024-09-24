import { faCheck, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

const Admin = () => {
    // potentialSponsorData for potential sponsors, from our email scraping tool
    const [potentialSponsorData, setPotentialSponsorData] = useState([
        {
            emailSender: "",
            potentialSponsorLinks: [""]
        }
    ]);

    const [sponsors, setSponsors] = useState([
        {
            newsletter: potentialSponsorData[0].emailSender,
            sponsor: "",
            sponsorLink: "",
            tags: [""]
        }
    ]);

    const handleAddSponsor = () => {
        setSponsors([...sponsors, { newsletter: sponsors[0].newsletter, sponsor: "", sponsorLink: "", tags: [""] }]);
    };

    const handleRemoveSponsor = (index: number) => {
        const newSponsors = sponsors.filter((_, i) => i !== index);
        setSponsors(newSponsors);
    };

    const handleSponsorChange = (index: number, field: string, value: string) => {
        const newSponsors = [...sponsors];
        newSponsors[index] = { ...newSponsors[index], [field]: value };
        setSponsors(newSponsors);
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();

        console.log(sponsors);

    }

    const handleDeny = async (e: any) => {
        e.preventDefault();

        let potentialSponsorDataCopy = [...potentialSponsorData];

        // Remove first element
        potentialSponsorData.shift();

        // Update state
        setPotentialSponsorData(potentialSponsorDataCopy);
    }

    useEffect(() => {
        // Call backend to get all potential sponsors
        const fetchedSponsorData = [
            {
                emailSender: "Health Tech Solutions <health-tech@gmail.com>",
                potentialSponsorLinks: ["https://www.example_sponsors-page.com", "https://www.blahblahJoslynsCutepage.com"]
            },
            {
                emailSender: "Northwest Finance <northwestFin@hot-mail.net>",
                potentialSponsorLinks: ["https://www.north-fin.com"]
            }
        ];

        setPotentialSponsorData(fetchedSponsorData);

        // Set sponsors after potentialSponsorData is populated
        setSponsors([
            {
                newsletter: fetchedSponsorData[0].emailSender,
                sponsor: "",
                sponsorLink: "",
                tags: [""]
            }
        ]);
    }, []);

    const checkDisabled = () => {
        if (sponsors.length === 0) {
            return true;
        }

        for (let i = 0; i < sponsors.length; i++) {
            if (sponsors[i].sponsor === "" || sponsors[i].sponsorLink === "" || sponsors[i].tags.length === 0) {
                return true;
            }
        }

        return false;
    }

    return (
        <div className="web-page">
            <div className="web-section admin" id="">
                <div className="admin-header__cont web-section-content">
                    <h1 className="admin-header">
                        <strong>Approve </strong> or <strong>Deny</strong> Sponsors
                    </h1>
                </div>
                <div className="admin-dash__cont">
                    <p className="admin-dash__text">
                        View all <strong>'Potential Sponsors'</strong> currently in the database.
                    </p>
                    <form className="admin-dash__form">
                        <div className="admin-dash__form-header">
                            <div className="admin-dash__form-body">
                                <p className="mb-0">
                                    Email Sender: <a href={potentialSponsorData[0].emailSender} target="_blank" rel="noreferrer">{potentialSponsorData[0].emailSender}</a>
                                </p>
                                <p className="mb-0 admin-dash__form-body__links">
                                    Potential Sponsors:
                                    <ul>
                                        {potentialSponsorData[0].potentialSponsorLinks.map((link, index) => {
                                            return <li><a key={index} href={link} target="_blank" rel="noreferrer">{link}</a></li>

                                        })}
                                    </ul>
                                </p>
                            </div>
                        </div>
                        {sponsors.map((sponsorData, index) => {
                            return <div className="admin-dash__sponsor-info">
                                <p className="mb-0">
                                    Sponsor  {index + 1}:
                                </p>
                                <input
                                    placeholder="Sponsor"
                                    className="admin-dash__form-input"
                                    onChange={(e) => { handleSponsorChange(index, "sponsor", e.target.value) }}
                                    value={sponsorData.sponsor}
                                />
                                <input
                                    placeholder="Sponsor Link"
                                    className="admin-dash__form-input"
                                    onChange={(e) => { handleSponsorChange(index, "sponsorLink", e.target.value) }}
                                    value={sponsorData.sponsorLink}
                                />
                                <input
                                    placeholder="tag1, tag2, etc"
                                    className="admin-dash__form-input"
                                    onChange={(e) => { handleSponsorChange(index, "tags", e.target.value) }}
                                    value={sponsorData.tags}
                                />
                                <button type="button" onClick={() => handleRemoveSponsor(index)} className="btn admin-dash__form-btn-remove_sponsor">
                                    Remove
                                </button>
                            </div>
                        })}

                        <button type="button" onClick={handleAddSponsor} className="btn admin-dash__form-btn-add_sponsor">
                            <FontAwesomeIcon icon={faPlus} />
                        </button>
                        <div className="admin-dash__sponsor-approve">
                            <button disabled={checkDisabled()} onClick={(e) => handleSubmit(e)} className="btn admin-dash__form-btn admin-dash__form-btn-approve">
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button onClick={(e) => handleDeny(e)} className="btn admin-dash__form-btn admin-dash__form-btn-deny">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Admin;
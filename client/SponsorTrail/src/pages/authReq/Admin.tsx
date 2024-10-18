import { faCheck, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import config from '../../config';
import axios from "axios";

// TODO: Render the email itself to the side of the form, to allow for easier viewing of the email - should be small and not take up too much space
const Admin = () => {
    // potentialSponsorData for potential sponsors, from our email scraping tool
    const [potentialSponsorData, setPotentialSponsorData] = useState([
        {
            emailSender: "",
            potentialSponsorLinks: [""],
            emailLink: "",
            _id: ""
        }
    ]);

    const [sponsors, setSponsors] = useState([
        {
            newsletter: "", // Same as emailSender
            sponsor: "",
            sponsorLink: "",
            tags: [""],
            _id: ""
        }
    ]);

    const handleAddSponsor = () => {
        setSponsors([...sponsors, { newsletter: sponsors[0].newsletter, sponsor: "", sponsorLink: "", tags: [""], _id: sponsors[0]._id }]);
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

        // Add newsletter to each sponsor
        for (let i = 0; i < sponsors.length; i++) {
            sponsors[i].newsletter = potentialSponsorData[0].emailSender;
        }

        console.log(sponsors);

        axios.post(`${config.backendUrl}sponsors/`, sponsors,
            {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            }).then((res) => {
                console.log(res);
            }).catch((err) => {
                console.log(err);
            })


        handleDeny(e);
    }

    const handleDeny = (e: any) => {
        e.preventDefault();
        const deniedSponsor = potentialSponsorData[0];

        // Remove item from potentialSponsors database using the id of the potentialSponsor
        axios.delete(`${config.backendUrl}potentialSponsors/${deniedSponsor._id}`,
            {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            }).then((res) => {
                console.log(res);
            }).catch((err) => {
                console.log(err);
            })

        let potentialSponsorDataCopy = [...potentialSponsorData];

        // Remove first element
        potentialSponsorDataCopy.shift();

        // Update state
        setPotentialSponsorData(potentialSponsorDataCopy);
    }

    const getSponsorData = async () => {
        await axios.get(`${config.backendUrl}potentialSponsors/`,
            {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            }).then((res) => {
                const potentialSponsorData = res.data;
                setPotentialSponsorData(potentialSponsorData);
            }).catch((err) => {
                console.log(err);
                return [];
            })
    }

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

    useEffect(() => {
        const fetchData = async () => {
            // call backend to get all potential sponsors
            await getSponsorData();
        }

        if (potentialSponsorData.length === 1) {
            fetchData();
        }
    }, [getSponsorData, setPotentialSponsorData]);

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
                    {(potentialSponsorData.length === 0) ? <h2 className="admin-dash__form-header">No New Emails</h2> :
                        <><form className="admin-dash__form">
                            <div className="admin-dash__form-header">
                                <div className="admin-dash__form-body">
                                    <p>
                                        Remaining: {potentialSponsorData.length - 1}
                                    </p>
                                    <p className="mb-0">
                                        Email Sender: <a href={potentialSponsorData[0].emailLink} target="_blank" rel="noreferrer">{potentialSponsorData[0].emailSender}</a>
                                    </p>
                                    <p className="mb-0 admin-dash__form-body__links">
                                        Potential Sponsors:
                                        <ul>
                                            {potentialSponsorData[0].potentialSponsorLinks.map((link, index) => {
                                                return <li>
                                                    <a key={index} href={link} target="_blank" rel="noreferrer">{link}</a>
                                                </li>

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
                        </>}
                </div>
            </div>
        </div>
    );
}

export default Admin;
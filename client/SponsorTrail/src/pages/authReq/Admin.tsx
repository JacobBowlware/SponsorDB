import { useEffect, useState } from "react";
import config from '../../config';
import axios from "axios";

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

interface Sponsor {
    newsletterSponsored: string;
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    subscriberCount: number;
    businessContact?: string;
    _id: string;
}

const Admin = () => {
    const [checked, setChecked] = useState(false);
    const [potentialSponsorAccordionClosed, setPotentialSponsorAccordionClosed] = useState(true);

    // Array of potential sponsors
    const [potentialSponsorData, setPotentialSponsorData] = useState([
        {
            newsletterSponsored: "",
            sponsorName: "",
            sponsorLink: "",
            tags: [""],
            subscriberCount: 0,
            businessContact: "",
            _id: "",
        }]);

    // Submit a sponsor to the database
    const handleSubmit = async (sponsor: any) => {

        try {
            await axios.post(`${config.backendUrl}sponsors/`, sponsor,
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                }).then(async (res) => {
                    // Remove the potential sponsor from the list
                    let tempSponsorData = [...potentialSponsorData];
                    tempSponsorData = tempSponsorData.filter((s) => s._id !== sponsor._id);
                    setPotentialSponsorData(tempSponsorData);
                }).catch((err) => {
                    console.log(err);
                })
        }
        catch (err) {
            console.log("Error Submitting Sponsor: ", err);
        }
    }

    // Delete the potential sponsor from the database
    const handleDeny = async (potentialSponsor: any) => {
        try {
            await axios.delete(`${config.backendUrl}potentialSponsors/${potentialSponsor._id}`,
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                }).then((res) => {
                    console.log(res);
                    let tempSponsorData = [...potentialSponsorData];
                    tempSponsorData = tempSponsorData.filter((sponsor) => sponsor._id !== potentialSponsor._id);
                    setPotentialSponsorData(tempSponsorData);
                }).catch((err) => {
                    console.log(err);
                })
        }
        catch (err) {
            console.log("Error Deleting Sponsor: ", err);
        }

    }

    // Get all potential sponsors from the database
    const getSponsorData = async () => {
        if (checked) {
            return;
        }

        await axios.get(`${config.backendUrl}potentialSponsors/`,
            {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            }).then((res) => {
                const potentialSponsorData = res.data;
                console.log(res.data);

                setPotentialSponsorData(potentialSponsorData);
                setChecked(true);
            }).catch((err) => {
                console.log(err);
                return [];
            })
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
                        <strong>Admin Dashboard</strong>
                    </h1>
                </div>
                <div className="admin-dash__cont web-section-content">
                    <p className="admin-dash__text">
                        View all <strong> Potential Sponsors</strong> currently in the database. ({potentialSponsorData.length})
                    </p>
                    <div className="admin-dash__form-accordian-container">
                        <div className="admin-dash__form-accordian" onClick={() => {
                            const element = document.querySelector(".admin-dash__form") as HTMLElement;
                            element.classList.toggle("active");
                            setPotentialSponsorAccordionClosed(!potentialSponsorAccordionClosed);
                        }}>
                            <h2 className="admin-dash__form-accordian-header-text">Potential Sponsors</h2>
                            <FontAwesomeIcon icon={potentialSponsorAccordionClosed ? faChevronDown : faChevronUp} className="admin-dash__form-accordian-icon" />
                        </div>
                        {(potentialSponsorData.length === 0) ? <h2 className="admin-dash__form-header">No Potential Sponsors in Database.</h2> :
                            <><form className="admin-dash__form">
                                {potentialSponsorData.map((sponsorData, index) => {
                                    return <div className="admin-dash__form-item">
                                        <div className="admin-dash__form-input-container">
                                            <input
                                                placeholder="Newsletter"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].newsletterSponsored = e.target.value;
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.newsletterSponsored}
                                            />
                                            <input
                                                placeholder="Sponsor"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].sponsorName = e.target.value;
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.sponsorName}
                                            />
                                        </div>
                                        <div className="admin-dash__form-input-container">
                                            <input
                                                placeholder="Sponsor Link"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].sponsorLink = e.target.value;
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.sponsorLink}
                                            />
                                            <input
                                                placeholder="tag1, tag2"
                                                className="admin-dash__form-input"
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' || e.key === 'Tab') {
                                                        e.preventDefault(); // Prevent space or tab
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].tags = e.target.value.split(",");
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.tags}
                                            />
                                        </div>
                                        <div className="admin-dash__form-input-container">
                                            <input
                                                placeholder="Subscriber Count"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    const updatedSubscriberCount = Number(e.target.value);
                                                    // Copy subscriber count to all sponsors that have the same newsletterSponsored field
                                                    if (updatedSubscriberCount > 0) {
                                                        const tempSponsorData = potentialSponsorData.map((sponsor, idx) => {
                                                            return sponsorData.newsletterSponsored === sponsor.newsletterSponsored
                                                                ? { ...sponsor, subscriberCount: updatedSubscriberCount }
                                                                : sponsor;
                                                        });
                                                        setPotentialSponsorData(tempSponsorData);
                                                    }
                                                }}
                                                value={sponsorData.subscriberCount}
                                            />
                                            <input
                                                placeholder="Business Contact"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    // Copy business contact to all sponsors that have the same newsletterSponsored field
                                                    const tempSponsorData = potentialSponsorData.map((sponsor, idx) => {
                                                        return sponsorData.newsletterSponsored === sponsor.newsletterSponsored
                                                            ? { ...sponsor, businessContact: e.target.value }
                                                            : sponsor;
                                                    });
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.businessContact}
                                            />
                                        </div>
                                        <div className="admin-dash__form-btn-container">
                                            <button type="button" onClick={async () => {
                                                // Submit the sponsor to DB
                                                await handleSubmit(sponsorData);
                                                // Remove the potential sponsor from the list
                                                setPotentialSponsorData(potentialSponsorData.filter((_, i) => i !== index));
                                                // Remove from DB
                                                await handleDeny(sponsorData);
                                            }}
                                                className="btn admin-dash__form-btn">
                                                APPROVE
                                            </button>
                                            <button type="button" onClick={async () => {
                                                // Remove from DB
                                                await handleDeny(sponsorData)
                                            }} className="btn admin-dash__form-btn">
                                                DENY
                                            </button>
                                        </div>
                                    </div>
                                })}
                            </form>
                            </>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
import { useEffect, useState } from "react";
import config from '../../config';
import axios from "axios";

const Admin = () => {
    const [checked, setChecked] = useState(false);

    // Array of potential sponsors
    const [potentialSponsorData, setPotentialSponsorData] = useState([
        {
            newsletterSponsored: "",
            sponsorName: "",
            sponsorLink: "",
            tags: [""],
            subscriberCount: 0,
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
                    console.log(res);
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
                        <strong>Approve </strong> or <strong>Deny</strong> Sponsors
                    </h1>
                </div>
                <div className="admin-dash__cont web-section-content">
                    <p className="admin-dash__text">
                        View all <strong> Potential Sponsors</strong> currently in the database. ({potentialSponsorData.length})
                    </p>
                    {(potentialSponsorData.length === 0) ? <h2 className="admin-dash__form-header">No New Emails</h2> :
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
                                        <input
                                            placeholder="Subscriber Count"
                                            className="admin-dash__form-input"
                                            onChange={(e) => {
                                                const updatedSubscriberCount = Number(e.target.value);

                                                // Deep copy the sponsor object at the index
                                                const tempSponsorData = potentialSponsorData.map((sponsor, idx) => {
                                                    return idx === index
                                                        ? { ...sponsor, subscriberCount: updatedSubscriberCount }
                                                        : sponsor;
                                                });

                                                setPotentialSponsorData(tempSponsorData);
                                            }}
                                            value={sponsorData.subscriberCount}
                                        />
                                    </div>
                                    <div className="admin-dash__form-input-container">
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
    );
}

export default Admin;
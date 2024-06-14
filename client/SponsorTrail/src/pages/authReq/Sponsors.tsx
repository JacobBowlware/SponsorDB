import AuthAirTable from "../../components/AuthAirTable";
import { useEffect, useState } from "react";

const Sponsors = () => {
    const [sponsorCount, setSponsorCount] = useState(0);

    useEffect(() => {
        // Call API to get sponsor count
        // setSponsorCount(response.data.count)
    })

    return (
        <div className="web-page">
            <div className="web-section sponsors" id="">
                <div className="sponsors-header__cont">
                    <h1 className="sponsors-header">SponsorTrail Database</h1>
                    <p className="sponsors-subheader">Here is where you can view all the sponsors in the SponsorTrail database -updated weekly.</p>
                    <p className="sponsors-subheader">
                        Currently, there are {sponsorCount} sponsors in the database.
                    </p>
                </div>
                <div className="airtable-cont">
                    <AuthAirTable />
                </div>
            </div>
        </div>
    );
}

export default Sponsors;
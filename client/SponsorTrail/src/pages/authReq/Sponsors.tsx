import axios from "axios";
import AuthAirTable from "../../components/AuthAirTable";
import { useEffect, useState } from "react";

const Sponsors = () => {
    const [sponsorCount, setSponsorCount] = useState(0);

    // const fetchSponsorCount = async () => {
    //     await axios.get('http://localhost:3001/api/sponsors/count', {
    //         headers: {
    //             'x-auth-token': localStorage.getItem('token')
    //         }
    //     }).then((d) => {
    //         return d.data.count;
    //     }).catch((err) => {
    //         console.log(err);
    //     });

    //     return 0;
    // }

    // useEffect(() => {
    //     // Call API to get sponsor count & update time
    //     fetchSponsorCount().then((count) => {
    //         setSponsorCount(count);
    //     })
    // })

    return (
        <div className="web-page">
            <div className="web-section sponsors" id="">
                <div className="sponsors-header__cont">
                    <h1 className="sponsors-header">Sponsor Database</h1>
                    <p className="sponsors-subheader">Here is where you can view all the sponsors in our database. If you're interested in a company, you should reach out to them directly with your information -or on their website if they have an application process.</p>
                    <p className="sponsors-subheader">
                        Updated every 24 hrs.
                    </p>
                </div>
                <div className="airtable-cont">
                    <AuthAirTable />
                </div>
            </div>
        </div >
    );
}

export default Sponsors;
import { useEffect, useState } from "react";
import AuthAirTable from "../../components/AuthAirTable";
import axios from "axios";
import config from "../../config";

// TODO: Pagination, Sponsor Search, Sponsor Filter, Sorting,
const Sponsors = () => {
    const [sponsors, setSponsors] = useState([
        {
            sponsorName: "",
            sponsorLink: "",
            tags: [""],
            newslettersSponsored: [""]
        }
    ]);
    const [currentPage, setCurrentPage] = useState(1);

    const sponsorsPerPage = 20;

    const fetchSponsors = async () => {
        const headers = {
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        }
        const res = await axios.get(`${config.backendUrl}sponsors`, headers);
        console.log(res);
        setSponsors(res.data);
    }

    useEffect(() => {
        fetchSponsors();
    }, []);

    return (
        <div className="web-page">
            <div className="web-section sponsors" id="">
                <div className="sponsors-header__cont web-section-content">
                    <h1 className="sponsors-header">Newsletter Sponsor Database</h1>
                    <p className="sponsors-subheader">
                        Here is where you can view all the sponsors in our database. If you're interested in a company, you should reach out to them directly with your information -or on their website if they have an application process.
                    </p>
                    <p className="sponsors-subheader">
                        Updated every 24 hrs.
                    </p>
                </div>
                <div className="airtable-cont web-section-content">
                    <table>
                        <thead>
                            <tr>
                                <th>Sponsor Name</th>
                                <th>Sponsor Link</th>
                                <th>Tags</th>
                                <th>Newsletters Sponsored</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sponsors.map((sponsor, index) => (
                                <tr key={index}>
                                    <td>{sponsor.sponsorName}</td>
                                    <td>
                                        <a href={sponsor.sponsorLink} target="_blank" rel="noopener noreferrer">
                                            {sponsor.sponsorLink}
                                        </a>
                                    </td>
                                    <td>{sponsor.tags.join(', ')}</td>
                                    <td>{sponsor.newslettersSponsored.filter(item => item).join(', ')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                </div>
            </div>
        </div >
    );
}

export default Sponsors;
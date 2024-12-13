import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faSearch, faSliders, faTimes } from "@fortawesome/free-solid-svg-icons";
import AuthAirTable from "../../components/AuthAirTable";

const Sponsors = () => {
    const [dbInfo, setDbInfo] = useState({
        sponsors: 0,
        newsletters: 0
    })
    const [loading, setLoading] = useState(false);

    const getDbInfo = async () => {
        // Get database info
        const dbInfo = await axios.get(`${config.backendUrl}sponsors/db-info`, {
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        });

        console.log(dbInfo.data);

        setDbInfo(dbInfo.data);
    }

    useEffect(() => {
        // Get database info
        if (dbInfo.sponsors === 0) {
            getDbInfo();
        }
    }, []);


    return (
        <div className="web-page web-page-authed">
            <div className="web-section sponsors" id="">
                <div className="sponsor-table__cont">
                    <h2 className="sponsor-table__cont-header">
                        Newsletter Sponsor Database
                    </h2>
                    <p className="sponsor-table__cont-header-p">
                        Currently showcasing <strong>{dbInfo.sponsors}</strong> from <strong>{dbInfo.newsletters}</strong> newsletters.
                    </p>
                    <div className="airtable-cont">
                        <AuthAirTable />
                    </div>
                </div>
            </div>
        </div >
    );
}

export default Sponsors;
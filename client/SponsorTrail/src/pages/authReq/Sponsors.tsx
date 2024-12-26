import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faComputer, faFilm, faHardDrive, faMoneyCheckDollar, faSpa, faSuitcase } from "@fortawesome/free-solid-svg-icons";
import AuthAirTable from "../../components/AuthAirTable";

interface SponsorsProps {
    sponsors: number;
    newsletters: number;
    lastUpdated: string;
}

const Sponsors = ({ sponsors, newsletters, lastUpdated }: SponsorsProps) => {

    return (
        <div className="web-page web-page-authed sponsors">
            <div className="web-section" id="">
                <div className="sponsor-table__cont web-section-content">
                    <h2 className="sponsor-table__cont-header">
                        Newsletter Sponsor Database
                    </h2>
                    <p className="sponsor-table__cont-header-p">
                        <strong>{sponsors} Sponsors</strong> from <strong>{newsletters} Newsletters</strong> -- Last Updated: <strong>{
                            new Date(lastUpdated).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })
                        }</strong>
                    </p>
                    <p className="sponsor-table__cont-header-h3 mb-0">
                        <strong>Popular Datasets</strong>
                    </p>
                    <div className="sponsor-tables__cont mb-2 mt-2">
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrFzoP3mgsFmUYf6" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faComputer} /> Technology
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrFzoP3mgsFmUYf6" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faHardDrive} /> Software
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrqO75gkDz3SfYl4" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faMoneyCheckDollar} />Finance
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrbYUt2Zsf6f3QNs" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faSuitcase} />Business & Marketing
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrxuYpqm5U9sgU25" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faSpa} /> Health & Wellness
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrCsz8wRcFOf9Kke" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faFilm} />Entertainment & Leisure
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrsxJKOcymXgM2Xw" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            <FontAwesomeIcon className="sponsor-tables__cont-link__icon" icon={faCartShopping} />Ecommerce
                        </a>
                    </div>
                    <div className="sponsor-tables__cont mb-3">
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrnAtqZlyABKGoXm" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            0 - 50,000 Subscribers
                        </a>
                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrcvcrbHyQuN11aI" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            50,000 - 100,000 Subscribers
                        </a>

                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shriyqZTRst5OPwWX" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            100,000 - 500,000 Subscribers
                        </a>

                        <a href="https://airtable.com/appn3l7KEp7wAQOZu/shrrN4t7oVs0e32xz" target="_blank" rel="noreferrer" className="sponsor-tables__cont-link">
                            500,000+ Subscribers
                        </a>
                    </div>
                    <p className="sponsor-table__cont-header-h3 mb-1">
                        <strong>Full Database</strong>
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
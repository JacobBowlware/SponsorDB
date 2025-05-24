import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faLaptopCode, faHeartbeat, faGraduationCap, faGamepad } from "@fortawesome/free-solid-svg-icons";
import PaidSponsorTable from "../../components/PaidSponsorTable";

interface SponsorsProps {
    sponsors: number;
    newsletters: number;
    lastUpdated: string;
}

const Sponsors = ({ sponsors, newsletters, lastUpdated }: SponsorsProps) => {
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="web-page">
            <div className="web-section web-section-dark mt-0">
                <div className="web-section__container web-section-content">
                    <div className="sponsor-table__cont">
                        <h2 className="sponsor-table__cont-header">
                            Full Sponsor Database
                        </h2>
                        <p className="sponsor-table__cont-header-p mt-2">
                            Access our complete database of <strong>{sponsors}</strong> sponsors from <strong>{newsletters}</strong> newsletters.
                            Last updated: {new Date(lastUpdated).toLocaleDateString()}
                        </p>
                        <div className="sponsor-table__filter-buttons">
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('all')}
                            >
                                <FontAwesomeIcon icon={faDatabase} className="sponsor-table__filter-button-icon" />
                                All Sponsors
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'technology' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('technology')}
                            >
                                <FontAwesomeIcon icon={faLaptopCode} className="sponsor-table__filter-button-icon" />
                                Technology
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'health' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('health')}
                            >
                                <FontAwesomeIcon icon={faHeartbeat} className="sponsor-table__filter-button-icon" />
                                Health
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'education' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('education')}
                            >
                                <FontAwesomeIcon icon={faGraduationCap} className="sponsor-table__filter-button-icon" />
                                Education
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${activeFilter === 'entertainment' ? 'active' : ''}`}
                                onClick={() => setActiveFilter('entertainment')}
                            >
                                <FontAwesomeIcon icon={faGamepad} className="sponsor-table__filter-button-icon" />
                                Entertainment
                            </button>
                        </div>
                        <div className="airtable-cont">
                            <PaidSponsorTable onError={setError} activeFilter={activeFilter} />
                            {error && <div className="sponsor-table__error">{error}</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sponsors;
import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faLaptopCode, faHeartbeat, faGraduationCap, faGamepad, faBullhorn, faBuilding, faGlobe } from "@fortawesome/free-solid-svg-icons";
import PaidSponsorTable from "../../components/PaidSponsorTable";

interface SponsorsProps {
    sponsors: number;
    newsletters: number;
    lastUpdated: string;
}

const Sponsors = ({ sponsors, newsletters, lastUpdated }: SponsorsProps) => {
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);

    const handleFilterClick = (filter: string) => {
        if (filter === 'all') {
            setActiveFilter('all');
            return;
        }

        // If the filter is already active, remove it
        if (activeFilter === filter) {
            setActiveFilter('all');
            return;
        }

        // If 'all' is currently active, just set the new filter
        if (activeFilter === 'all') {
            setActiveFilter(filter);
            return;
        }

        // Add the new filter to the existing ones
        setActiveFilter(prev => {
            const currentFilters = prev.split(',').map(f => f.trim());
            if (currentFilters.includes(filter)) {
                // Remove the filter if it's already present
                const newFilters = currentFilters.filter(f => f !== filter);
                return newFilters.length > 0 ? newFilters.join(', ') : 'all';
            } else {
                // Add the new filter
                return [...currentFilters, filter].join(', ');
            }
        });
    };

    const isFilterActive = (filter: string) => {
        if (filter === 'all') return activeFilter === 'all';
        return activeFilter.split(',').map(f => f.trim()).includes(filter);
    };

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
                                className={`sponsor-table__filter-button ${isFilterActive('all') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('all')}
                            >
                                <FontAwesomeIcon icon={faDatabase} className="sponsor-table__filter-button-icon" />
                                All Sponsors
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${isFilterActive('technology') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('technology')}
                            >
                                <FontAwesomeIcon icon={faLaptopCode} className="sponsor-table__filter-button-icon" />
                                Technology
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${isFilterActive('health') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('health')}
                            >
                                <FontAwesomeIcon icon={faHeartbeat} className="sponsor-table__filter-button-icon" />
                                Health
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${isFilterActive('education') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('education')}
                            >
                                <FontAwesomeIcon icon={faGraduationCap} className="sponsor-table__filter-button-icon" />
                                Education
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${isFilterActive('entertainment') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('entertainment')}
                            >
                                <FontAwesomeIcon icon={faGamepad} className="sponsor-table__filter-button-icon" />
                                Entertainment
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${isFilterActive('marketing') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('marketing')}
                            >
                                <FontAwesomeIcon icon={faBullhorn} className="sponsor-table__filter-button-icon" />
                                Marketing
                            </button>
                            <button 
                                className={`sponsor-table__filter-button ${isFilterActive('business') ? 'active' : ''}`}
                                onClick={() => handleFilterClick('business')}
                            >
                                <FontAwesomeIcon icon={faBuilding} className="sponsor-table__filter-button-icon" />
                                Business
                            </button>
                        </div>
                        <div className="airtable-cont">
                            <PaidSponsorTable onError={setError} activeFilter={activeFilter} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sponsors;
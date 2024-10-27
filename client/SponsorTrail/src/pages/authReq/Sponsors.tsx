import AuthAirTable from "../../components/AuthAirTable";

const Sponsors = () => {
    return (
        <div className="web-page">
            <div className="web-section sponsors" id="">
                <div className="web-section-content sponsors-header__cont">
                    <h1 className="sponsors-header">Newsletter Sponsor Database</h1>
                    <p className="sponsors-subheader">
                        View all sponsors currently in the database. If needed, sort by Newsletter, Audience Size, Date Added, or Tags to find the perfect sponsor for your newsletter.
                    </p>
                    <p className="sponsors-subheader text-italic text-bold">
                        Updated every 24 hrs
                    </p>
                </div>
                <div className="airtable-cont web-section-content">
                    <AuthAirTable />
                </div>
            </div>
        </div >
    );
}

export default Sponsors;
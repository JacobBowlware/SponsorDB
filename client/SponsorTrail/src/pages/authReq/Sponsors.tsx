import AuthAirTable from "../../components/AuthAirTable";

const Sponsors = () => {

    return (
        <div className="web-page">
            <div className="web-section sponsors" id="">
                <div className="sponsors-header__cont">
                    <h1 className="sponsors-header">Sponsor Database</h1>
                    <p className="sponsors-subheader">
                        Here is where you can view ALL the sponsors in our database. If you're interested in a company, you should reach out to them directly with your information -or on their website if they have an application process.
                    </p>
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
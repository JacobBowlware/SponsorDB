import Pricing from "../../components/Pricing";
import DBLockedSS from '../../assets/images/DBLockedSS.png';

interface SubscribeProps {
    isSubscribed: boolean;
}

const Subscribe = ({ isSubscribed }: SubscribeProps) => {
    return <div className="web-page">
        <div className="web-section web-section-dark subscribe">
            <div className="web-section__container web-section-content">
                <Pricing isSubscribed={isSubscribed} subscribePage={true} />
                <div className="subscribe-img-container">
                    <img src={DBLockedSS} alt="Database Locked" className="subscribe-img" />
                </div>
            </div>
        </div>
    </div>
}

export default Subscribe;
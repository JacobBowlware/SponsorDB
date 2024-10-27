import Pricing from "../../components/Pricing";

interface SubscribeProps {
    isSubscribed: boolean;
}

const Subscribe = ({ isSubscribed }: SubscribeProps) => {
    return <div className="web-page">
        <div className="web-section subscribe">
            <Pricing isSubscribed={isSubscribed} subscribePage={true} />
        </div>
    </div>
}

export default Subscribe;
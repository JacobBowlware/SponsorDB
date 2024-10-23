import Pricing from "../../components/Pricing";

interface SubscribeProps {
    isSubscribed: boolean;
}

const Subscribe = ({ isSubscribed }: SubscribeProps) => {
    return <div className="web-page">
        <div>
            <Pricing isSubscribed={isSubscribed} subscribePage={true} />
        </div>
    </div>
}

export default Subscribe;
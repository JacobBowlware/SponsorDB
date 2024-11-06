import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface PricingCardProps {
    header: string;
    icon: any;
    price: string;
    text: string;
    year?: boolean;
    handleSubscribe?: () => void;
}

const PricingCard = ({ header, icon, price, text, year, handleSubscribe }: PricingCardProps) => {
    return (
        <div className="home__pricing-card">
            <h3 className={"home__pricing-card__header"}>
                {header}
            </h3>
            <FontAwesomeIcon className={"home__pricing-card__icon"} icon={icon} />
            <p className="home__pricing-card__price">
                {price} {year && <span className="home__pricing-card__price__time">/year</span>} {!year && <span className="home__pricing-card__price__time">/month</span>}
            </p>
            <p className="home__pricing-card__text">
                {text}
            </p>
            <button onClick={handleSubscribe} className="btn home__pricing-card__btn bg-dark">
                Subscribe
            </button>
        </div>
    );
}

export default PricingCard;
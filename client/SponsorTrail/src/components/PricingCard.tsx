import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface PricingCardProps {
    header: string;
    icon: any;
    price: string;
    text: string;
}

const PricingCard = ({ header, icon, price, text }: PricingCardProps) => {
    return (
        <div className="home__pricing-card">
            <h3 className="home__pricing-card__header">
                {header}
            </h3>
            <FontAwesomeIcon className="home__pricing-card__icon" icon={icon} />
            <p className="home__pricing-card__price">
                {price}
            </p>
            <p className="home__pricing-card__text">
                {text}
            </p>
            <Link to="/pricing" className="btn home__pricing-card__btn">
                Get it Now
            </Link>
        </div>
    );
}

export default PricingCard;
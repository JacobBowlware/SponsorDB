import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface PricingCardProps {
    header: string;
    icon: any;
    price: string;
    text: string;
    year?: boolean;
}

const PricingCard = ({ header, icon, price, text, year }: PricingCardProps) => {
    const textStyle = year ? ' text-highlight' : ' text-dark';
    const btnStlye = year ? ' ' : ' bg-dark'
    return (
        <div className="home__pricing-card">
            <h3 className={"home__pricing-card__header" + textStyle}>
                {header}
            </h3>
            <FontAwesomeIcon className={"home__pricing-card__icon" + textStyle} icon={icon} />
            <p className="home__pricing-card__price">
                {price} {year && <span className="home__pricing-card__price__time">/year</span>} {!year && <span className="home__pricing-card__price__time">/month</span>}
            </p>
            <p className="home__pricing-card__text">
                {text}
            </p>
            <Link to="/pricing" className={"btn home__pricing-card__btn" + btnStlye}>
                Get it Now
            </Link>
        </div>
    );
}

export default PricingCard;
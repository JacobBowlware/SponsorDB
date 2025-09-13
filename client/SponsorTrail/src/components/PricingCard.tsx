import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface PricingCardProps {
    header: string;
    icon: any;
    price: string;
    text: string[];
    year?: boolean;
    handlePurchase?: () => void;
}

const PricingCard = ({ header, icon, price, text, year, handlePurchase }: PricingCardProps) => {
    return (
        <div className="home__pricing-card">
            <div className="home__pricing-card-section__cont">
                <div className="home__pricing-card__header__cont">
                    <h3 className="home__pricing-card__header">{header}</h3>
                </div>
                <ul className="home__pricing-card__list">
                    {text.map((t, i) => <li className="home__pricing-card__list-item" key={i}>
                        <FontAwesomeIcon icon={faCheck} /> {t}</li>)}
                </ul>
            </div>
            <div className="home__pricing-card-section__cont">
                < p className="home__pricing-card__price" >
                    {price} {year && <span className="home__pricing-card__price__time">/year</span>} {!year && <span className="home__pricing-card__price__time">/month</span>}
                </p>
                <button onClick={handlePurchase} className="home__pricing-card__cta-button">
                    Get Started
                </button>
            </div>
        </div>
    );
}

export default PricingCard;
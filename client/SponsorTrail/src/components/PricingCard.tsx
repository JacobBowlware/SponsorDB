import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface PricingCardProps {
    header: string;
    icon: any;
    price: string;
    text: string[];
    year?: boolean;
    handleSubscribe?: () => void;
}

const PricingCard = ({ header, icon, price, text, year, handleSubscribe }: PricingCardProps) => {
    return (
        <div className="home__pricing-card">
            <div className="home__pricing-card-section__cont">
                <h3 className="home__pricing-card__header">
                    {header}
                </h3>
                <ul className="home__pricing-card__list">
                    {text.map((t, i) => <li className="mb-2" key={i}>{t}</li>)}
                </ul>
            </div>
            <div className="home__pricing-card-section__cont">
                < p className="home__pricing-card__price" >
                    {price} {year && <span className="home__pricing-card__price__time">/year</span>} {!year && <span className="home__pricing-card__price__time">/month</span>}
                </p>
                <button onClick={handleSubscribe} className="btn home__pricing-card__btn bg-dark">
                    Get Started
                </button>
            </div>
        </div>
    );
}

export default PricingCard;
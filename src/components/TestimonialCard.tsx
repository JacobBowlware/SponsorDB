import { faQuoteLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TestimonialCardProps {
    name: string;
    affiliation: string;
    quote: string;
}

const TestimonialCard = ({ name, affiliation, quote }: TestimonialCardProps) => {
    return (
        <div className="home__testimonials-list__item">
            <FontAwesomeIcon icon={faQuoteLeft} className="home__testimonials-list__item-quote-icon" />
            <p className="home__testimonials-list__item-quote">
                {quote}
            </p>
            <div className="home__testimonials-list__item-footer-container">
                <h3 className="home__testimonials-list__item-name">
                    {name}
                </h3>
                <p className="home__testimonials-list__item-affiliation">
                    {affiliation}
                </p>
            </div>
        </div>
    );
}

export default TestimonialCard;
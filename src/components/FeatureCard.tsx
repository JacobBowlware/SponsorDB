import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface FeatureCardProps {
    icon: any;
    header: string;
    text: string;
    highlighted?: boolean;
}

const FeatureCard = ({ icon, header, text, highlighted }: FeatureCardProps) => {

    if (highlighted) {
        return (
            <div className="home__features-list__item home__features-list__item--highlighted">
                <FontAwesomeIcon className="home__features-list__item-icon home__features-list__item-icon--highlighted" icon={icon} />
                <h3 className="home__features-list__item-header">
                    {header}
                </h3>
                <p className="home__features-list__item-text">
                    {text}
                </p>
            </div>
        );
    }

    return (
        <div className="home__features-list__item">
            <FontAwesomeIcon className="home__features-list__item-icon" icon={icon} />
            <h3 className="home__features-list__item-header">
                {header}
            </h3>
            <p className="home__features-list__item-text">
                {text}
            </p>
        </div>
    );
}

export default FeatureCard;
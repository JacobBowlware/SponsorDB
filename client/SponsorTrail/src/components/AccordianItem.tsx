import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface AccordianItemProps {
    title: string;
    content: string;
    onPress: () => void;
    isOpen: boolean;
}


const AccordianItem = ({ title, content, onPress, isOpen }: AccordianItemProps) => {
    return (
        <div className="accordian-item">
            <div className="accordian-item-header" onClick={onPress}>
                <h3 className="header-3 accordian-item__header">{title}</h3>
                <FontAwesomeIcon className="accordian-item__icon" icon={isOpen ? faChevronUp : faChevronDown} />
            </div>
            {
                isOpen && <div className="accordian-item-content">
                    <p className="p accordian-item__p text">
                        {content}
                    </p>
                </div>
            }
        </div>
    );
}

export default AccordianItem;
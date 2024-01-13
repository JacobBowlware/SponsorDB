import { Link } from "react-router-dom";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AllBlogsItemProps {
    title: string;
    body: string;
    link: string;
}

const AllBlogsItem = ({ title, body, link }: AllBlogsItemProps) => {
    return (
        <div className="all-blogs__container-item">
            <h1 className="all-blogs__container-item__title">
                {title}
            </h1>
            <p className="all-blogs__container-item__body">
                {body}
            </p>
            <Link to={link} className="all-blogs__container-item__link">
                Read More <FontAwesomeIcon className="all-blogs__container-item__icon" icon={faArrowRight} />
            </Link>
        </div>
    );
}

export default AllBlogsItem;
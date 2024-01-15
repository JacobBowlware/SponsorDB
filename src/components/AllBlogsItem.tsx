import { Link } from "react-router-dom";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AllBlogsItemProps {
    title: string;
    body: string;
    link: string;
    small?: boolean;
    left?: boolean;
    right?: boolean;
    dark?: boolean;
}

const AllBlogsItem = ({ title, body, link, small, left, right, dark }: AllBlogsItemProps) => {
    let addedClass = ""
    if (left) {
        addedClass = 'small-first'
    } else if (right) {
        addedClass = 'small-second'
    }

    if (dark) {
        addedClass += ' dark'
    }

    if (small) {
        return (
            <div className={`all-blogs__container-item small ${addedClass}`}>
                <h1 className="all-blogs__container-item__title title-small">
                    {title}
                </h1>
                <p className="all-blogs__container-item__body body-small">
                    {body}
                </p>
                <Link to={link} className="all-blogs__container-item__link link-small">
                    Read More <FontAwesomeIcon className="all-blogs__container-item__icon icon-small" icon={faArrowRight} />
                </Link>
            </div>
        );
    }
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
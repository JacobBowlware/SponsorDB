import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKiwiBird } from "@fortawesome/free-solid-svg-icons";


interface LoadingBtnProps {
    loading: boolean;
    title: string;
}

const LoadingBtn = ({ loading, title }: LoadingBtnProps) => {
    return (
        <button id="email-btn" className="home__container-item__btn review-btn" type="submit">
            {loading ? <FontAwesomeIcon className="home__container-item__btn-icon" icon={faKiwiBird} /> : title}
        </button>
    );
}

export default LoadingBtn;
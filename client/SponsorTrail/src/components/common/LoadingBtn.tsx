import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKiwiBird } from "@fortawesome/free-solid-svg-icons";
interface LoadingBtnProps {
    loading: boolean;
    title: string;
    addClasses?: string;
}

const LoadingBtn = ({ loading, title, addClasses }: LoadingBtnProps) => {
    return (
        <button id="loading-btn" className={`home__container-item__btn review-btn ${addClasses}`} type="submit">
            {loading ? <FontAwesomeIcon className="home__container-item__btn-icon" icon={faKiwiBird} /> : title}
        </button>
    );
}

export default LoadingBtn;
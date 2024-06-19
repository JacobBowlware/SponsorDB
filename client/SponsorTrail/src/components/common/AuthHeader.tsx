import { useState } from "react";

// Font Awesome Icons
import { faBars, faKiwiBird, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const AuthHeader = () => {
    const [navOpen, setNavOpen] = useState(false);

    const closeNavBar = () => {
        setNavOpen(false);

        const navbar = document.getElementById('navbarNav');
        if (navbar) {
            navbar.classList.remove('show');
        }
    }

    return (
        <div className="navbar-wrap sticky-top">
            <nav className={`web-section navbar navbar-expand-lg navbar-light  `}>
                <a className="navbar-brand" href="/">SponsorTrail <FontAwesomeIcon icon={faKiwiBird} /> </a>
                <button onClick={() => setNavOpen(!navOpen)} className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <FontAwesomeIcon className="nav-icon" icon={navOpen ? faXmark : faBars} />
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link" to="/sponsors" onClick={closeNavBar}>Database</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/profile" onClick={closeNavBar}>Profile</Link>
                        </li>
                        <li className="nav-item  nav-item__highlight">
                            <button className="nav-link" onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/login';
                            }}>Logout</button>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
}

export default AuthHeader;
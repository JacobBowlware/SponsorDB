import { useState } from "react";

// Font Awesome Icons
import { faBars, faDatabase, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

interface AuthHeaderProps {
    isAdmin: boolean;
}

const AuthHeader = ({ isAdmin }: AuthHeaderProps) => {
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
                <a className="navbar-brand" href="/">SponsorDB <FontAwesomeIcon className="nav-icon" icon={faDatabase} /></a>
                <button onClick={() => setNavOpen(!navOpen)} className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <FontAwesomeIcon className="nav-icon" icon={navOpen ? faXmark : faBars} />
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        {isAdmin && <li className="nav-item">
                            <Link className="nav-link" to="/admin" onClick={closeNavBar}>Admin</Link>
                        </li>}
                        <li className="nav-item">
                            <Link className="nav-link" to="/sponsors" onClick={closeNavBar}>Database</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/profile" onClick={closeNavBar}>Profile</Link>
                        </li>
                        <li className="nav-item  nav-item__highlight nav-item__highlight-dark" onClick={() => {
                            localStorage.removeItem('token');
                            window.location.reload();
                        }}>
                            <Link to="/login" className="nav-link nav-link__dark">Logout</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
}

export default AuthHeader;
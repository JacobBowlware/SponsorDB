import { useState } from "react";

// Font Awesome Icons
import { faBars, faDatabase, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

interface AuthHeaderProps {
    isAdmin: boolean;
    isSubscribed: boolean;
}

const AuthHeader = ({ isAdmin, isSubscribed }: AuthHeaderProps) => {
    const [navOpen, setNavOpen] = useState(false);

    const closeNavBar = () => {
        setNavOpen(false);

        const navbar = document.getElementById('navbarNav');
        if (navbar) {
            navbar.classList.remove('show');
        }
    }

    return (
        <div className="navbar-wrap sticky-top navbar__dark">
            <nav className={`web-section navbar navbar-expand-lg navbar__dark `}>
                <a className="navbar-brand navbar-brand__dark" href="/">SponsorDB <FontAwesomeIcon className="nav-icon" icon={faDatabase} /></a>
                <button onClick={() => setNavOpen(!navOpen)} className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <FontAwesomeIcon className="nav-icon nav-icon__dark" icon={navOpen ? faXmark : faBars} />
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav navbar-nav__dark">
                        {isAdmin && <li className="nav-item">
                            <Link className="nav-link nav-link__dark" to="/admin" onClick={closeNavBar}>Admin</Link>
                        </li>}
                        <li className="nav-item">
                            <Link className="nav-link nav-link__dark" to={isSubscribed ? "/sponsors/" : "/subscribe/"} onClick={closeNavBar}>Database</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link nav-link__dark" to="/profile" onClick={closeNavBar}>Profile</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link nav-link__dark" to="/blog" onClick={closeNavBar}>Blog</Link>
                        </li>
                        <li className="nav-item  nav-item__highlight nav-item__highlight-dark" onClick={() => {
                            localStorage.removeItem('token');
                            window.location.reload();
                        }}>
                            <Link to="/login" className="nav-link">Logout</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
}

export default AuthHeader;
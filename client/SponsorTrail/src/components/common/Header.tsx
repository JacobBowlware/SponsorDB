import { useState } from "react";

// Font Awesome Icons
import { faBars, faDatabase, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";

const Header = () => {
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
                <a className="navbar-brand" href="/">SponsorDB <FontAwesomeIcon className="nav-icon" icon={faDatabase} />
                </a>
                <button onClick={() => setNavOpen(!navOpen)} className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <FontAwesomeIcon className="nav-icon" icon={navOpen ? faXmark : faBars} />
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        {/* <li className="nav-item">
                            <a className="nav-link" href="/#sample-data" onClick={closeNavBar}>Database</a>
                        </li> */}
                        <li className="nav-item">
                            <a className="nav-link" href="/#features" onClick={closeNavBar}>Features</a>
                        </li>
                        {/* <li className="nav-item">
                            <a className="nav-link" href="/#pricing" onClick={closeNavBar}>Pricing</a>
                        </li> */}
                        <li className="nav-item">
                            <a className="nav-link" href="/#testimonials" onClick={closeNavBar}>Testimonials</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="/#FAQ" onClick={closeNavBar}>FAQ</a>
                        </li>
                        <li className="nav-item  nav-item__highlight">
                            <Link className="nav-link" to="/login" onClick={closeNavBar}>Login</Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </div>
    );
}

export default Header;
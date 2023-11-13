import { useState } from "react";

// Font Awesome Icons
import { faBars, faKiwiBird, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Header = () => {
    const [navOpen, setNavOpen] = useState(false);

    return (
        <nav className="web-section navbar navbar-expand-lg navbar-light sticky-top" >
            <a className="navbar-brand" href="/">SponsorTrail <FontAwesomeIcon icon={faKiwiBird} /> </a>
            <button onClick={() => setNavOpen(!navOpen)} className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <FontAwesomeIcon className="nav-icon" icon={navOpen ? faXmark : faBars} />
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" href="/#features">Features</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/#how-it-works">How It Works</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/#testimonials">Testimonials</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/#FAQ">FAQ</a>
                    </li>
                    <li className="nav-item  nav-item__highlight">
                        <a className="nav-link" href="/#hero">Join Waitlist</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Header;
import { faArrowLeft, faArrowRight, faDatabase, faMagnifyingGlass, faMessage, faUser, faNewspaper } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';

interface NavMenuProps {
    purchased: boolean;
    isAdmin: boolean;
}

const NavMenu = ({ isAdmin, purchased }: NavMenuProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [addClass, setAddClass] = useState("menu__link-text-hidden");
    const location = useLocation();

    const handleNavMenu = () => {
        setMenuOpen(!menuOpen);
        setAddClass(menuOpen ? "menu__link-text-hidden" : "");
    }

    // Close menu on mobile when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu && !navMenu.contains(event.target as Node)) {
                setMenuOpen(false);
                setAddClass("menu__link-text-hidden");
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
        setAddClass("menu__link-text-hidden");
    }, [location]);

    return (
        <div className={`nav-menu ${menuOpen ? 'expanded' : ''}`}>
            <div className="nav-menu__item">
                <button 
                    onClick={handleNavMenu} 
                    className="nav-menu__btn"
                    aria-label={menuOpen ? "Collapse menu" : "Expand menu"}
                >
                    <FontAwesomeIcon 
                        className="nav-menu__btn-icon" 
                        icon={menuOpen ? faArrowLeft : faArrowRight} 
                    />
                </button>
            </div>
            <div className={`nav-menu__item ${location.pathname === '/sponsors' ? 'active' : ''}`}>
                <Link 
                    to="/sponsors" 
                    className="nav-menu__link"
                    data-tooltip="Sponsors"
                >
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faDatabase} />
                    <span className={`nav-menu__link-text ${addClass}`}>
                        Sponsors
                    </span>
                </Link>
            </div>
            <div className={`nav-menu__item ${location.pathname === '/feedback' ? 'active' : ''}`}>
                <Link 
                    to="/feedback" 
                    className="nav-menu__link"
                    data-tooltip="Feedback"
                >
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faMessage} />
                    <span className={`nav-menu__link-text ${addClass}`}>
                        Feedback
                    </span>
                </Link>
            </div>
            <div className={`nav-menu__item ${location.pathname === '/blog' ? 'active' : ''}`}>
                <Link 
                    to="/blog" 
                    className="nav-menu__link"
                    data-tooltip="Blog"
                >
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faNewspaper} />
                    <span className={`nav-menu__link-text ${addClass}`}>
                        Blog
                    </span>
                </Link>
            </div>
            <div className={`nav-menu__item ${location.pathname === '/profile' ? 'active' : ''}`}>
                <Link 
                    to="/profile" 
                    className="nav-menu__link"
                    data-tooltip="Profile"
                >
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faUser} />
                    <span className={`nav-menu__link-text ${addClass}`}>
                        Profile
                    </span>
                </Link>
            </div>
            {isAdmin && (
                <div className={`nav-menu__item ${location.pathname === '/admin' ? 'active' : ''}`}>
                    <Link 
                        to="/admin" 
                        className="nav-menu__link"
                        data-tooltip="Admin"
                    >
                        <FontAwesomeIcon className="nav-menu__link-icon" icon={faMagnifyingGlass} />
                        <span className={`nav-menu__link-text ${addClass}`}>
                            Admin
                        </span>
                    </Link>
                </div>
            )}
        </div>
    );
}

export default NavMenu;


import { faArrowLeft, faArrowRight, faDatabase, faMagnifyingGlass, faMessage, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { useState } from 'react';

interface NavMenuProps {
    purchased: boolean;
    isAdmin: boolean;
}

const NavMenu = ({ isAdmin, purchased }: NavMenuProps) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [addClass, setAddClass] = useState("menu__link-text-hidden");
    const [active, setActive] = useState(0);

    const handleNavMenu = () => {
        setMenuOpen(!menuOpen);

        if (!menuOpen) {
            setAddClass("");
        } else {
            setAddClass("menu__link-text-hidden");
        }
    }

    // Handle when the user clicks on a NavMenu Link 
    const handleActive = (e: any, numPressed: Number) => {
        // Active == 0 means btn was pressed, 1 means sponsor, 2 means feedback, 3 means profile, 4 means admin

        // Close the menu
        if (menuOpen) {
            setMenuOpen(false);
        }

        setAddClass("menu__link-text-hidden");

        // // Remove the old active class
        // if (active === 1) {
        //     document.getElementById("sponsors")?.classList.remove("nav-menu__link-active");
        // }
        // else if (active === 2) {
        //     document.getElementById("feedback")?.classList.remove("nav-menu__link-active");
        // }
        // else if (active === 3) {
        //     document.getElementById("profile")?.classList.remove("nav-menu__link-active");
        // }
        // else if (active === 4) {
        //     document.getElementById("admin")?.classList.remove("nav-menu__link-active");
        // }

        // setActive(Number(numPressed));

        // Set the new active class
        // e.target.classList.add("nav-menu__link-active");
    }

    return (
        <div className="nav-menu">
            <div className="nav-menu__item">
                <button id="nav-btn" onClick={() => {
                    setActive(0);
                    handleNavMenu();
                }} className="nav-menu__btn nav-menu__link">
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={menuOpen ? faArrowLeft : faArrowRight} />
                </button>
            </div>
            <div className="nav-menu__item">
                <Link onClick={(e) => {
                    handleActive(e, 1);
                }} id="sponsors" to="/sponsors" className="nav-menu__link">
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faDatabase} /> <span className={"nav-menu__link-text " + addClass}>
                        Sponsors
                    </span>
                </Link>
            </div>
            <div className="nav-menu__item">
                <Link onClick={(e) => {
                    handleActive(e, 2);
                }} id="feedback" to="/feedback" className="nav-menu__link">
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faMessage} /> <span className={"nav-menu__link-text " + addClass}>
                        Feedback
                    </span>
                </Link>
            </div>
            <div className="nav-menu__item">
                <Link onClick={(e) => {
                    handleActive(e, 3);
                }} id="profile" to="/profile" className="nav-menu__link">
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faUser} /> <span className={"nav-menu__link-text " + addClass}>
                        Profile
                    </span>
                </Link>
            </div>
            {isAdmin && <div className="nav-menu__item">
                <Link onClick={(e) => {
                    handleActive(e, 4);
                }} id="admin" to="/admin" className="nav-menu__link">
                    <FontAwesomeIcon className="nav-menu__link-icon" icon={faMagnifyingGlass} /> <span className={"nav-menu__link-text " + addClass}>
                        Admin
                    </span>
                </Link>
            </div>}
        </div>
    );
}

export default NavMenu;


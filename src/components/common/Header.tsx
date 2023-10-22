
const Header = () => {
    return (
        <nav className="web-section navbar navbar-expand-lg navbar-light">
            <a className="navbar-brand" href="#">SurfSight</a>
            <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav">
                    <li className="nav-item">
                        <a className="nav-link" href="/#">Login</a>
                    </li>
                    <li className="nav-item nav-item__highlight">
                        <a className="nav-link" href="/#">Get SurfSight</a>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default Header;
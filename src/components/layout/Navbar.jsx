import { Link } from "react-router-dom";
import logoIcon from "../../assets/logo-icon.png";
import "./Navbar.css";

// variant="transparent": floats over a hero image (Home).
// variant="solid": sits in normal flow with a background (every other page).
export function Navbar({ variant = "solid", links = [], activeHref, onLinkClick, actions }) {
  return (
    <header className={`navbar navbar-${variant}`}>
      <div className="navbar-inner container">
        <Link to="/home" className="navbar-logo">
          <span className="navbar-logo-mark">
            <img src={logoIcon} alt="" />
          </span>
          <span className="navbar-logo-text">eKoolie</span>
        </Link>

        {links.length > 0 && (
          <nav className="navbar-links">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`navbar-link${activeHref === link.href ? " is-active" : ""}`}
                onClick={(event) => onLinkClick?.(event, link)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        {actions && <div className="navbar-actions">{actions}</div>}
      </div>
    </header>
  );
}

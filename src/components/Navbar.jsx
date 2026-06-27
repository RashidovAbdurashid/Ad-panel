import { Link, NavLink } from 'react-router-dom';
import { FiUser, FiMenu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';
import './Navbar.css';

const navLinks = [{ to: '/profile', label: 'Profile', icon: <FiUser size={16} /> }];

export default function Navbar({ onToggleSidebar }) {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <FiMenu size={20} />
        </button>
        <Link to="/" className="navbar-brand">
          <span className="navbar-brand-mark">A</span>
          <span className="navbar-brand-text">Atlas Admin</span>
        </Link>
      </div>

      <nav className="navbar-links">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `navbar-link ${isActive ? 'navbar-link--active' : ''}`}
            end={link.to === '/'}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="navbar-right">
        <div className="navbar-user">
          <span className="avatar avatar--nav">{getInitials(user?.username || 'A')}</span>
          <span className="navbar-username">{user?.username}</span>
        </div>
      </div>
    </header>
  );
}

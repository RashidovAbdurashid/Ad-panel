import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiShoppingCart, FiActivity, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const sidebarLinks = [
  { to: '/', label: 'Home', icon: <FiHome size={17} />, end: true },
  { to: '/users', label: 'Users', icon: <FiUsers size={17} /> },
  { to: '/carts', label: 'Cart List', icon: <FiShoppingCart size={17} /> },
];

export default function Sidebar({ isOpen }) {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-section-label">Navigation</div>
      <nav className="sidebar-nav">
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
          >
            <span className="sidebar-link-indicator" />
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="sidebar-logout" onClick={logout}>
        <FiLogOut size={17} />
        <span>Logout</span>
      </button>

      <div className="sidebar-footer">
        <div className="sidebar-status">
          <FiActivity size={13} />
          <span>API connected</span>
        </div>
        <span className="sidebar-version mono">v1.0.0</span>
      </div>
    </aside>
  );
}

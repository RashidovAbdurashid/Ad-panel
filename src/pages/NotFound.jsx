import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import './NotFound.css';

export default function NotFound() {
  return (
    <div className="not-found">
      <span className="not-found-code mono">404</span>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="not-found-link">
        <FiArrowLeft size={15} /> Back to dashboard
      </Link>
    </div>
  );
}

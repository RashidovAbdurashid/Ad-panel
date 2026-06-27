import './Loader.css';

export default function Loader({ fullScreen = false, label = 'Loading…', size = 'md' }) {
  return (
    <div className={`loader-wrap ${fullScreen ? 'loader-wrap--full' : ''}`}>
      <span className={`loader-spinner loader-spinner--${size}`} aria-hidden="true" />
      {label && <span className="loader-label">{label}</span>}
    </div>
  );
}

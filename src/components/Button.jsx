import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon = null,
  className = '',
  ...rest
}) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${className}`}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading ? (
        <span className="btn-spinner" aria-hidden="true" />
      ) : (
        icon && <span className="btn-icon">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}

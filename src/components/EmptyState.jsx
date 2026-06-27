import { FiInbox } from 'react-icons/fi';
import './EmptyState.css';

export default function EmptyState({
  icon = <FiInbox size={28} />,
  title = 'Nothing here yet',
  message = 'There is no data to show right now.',
  action = null,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h4>{title}</h4>
      <p>{message}</p>
      {action}
    </div>
  );
}

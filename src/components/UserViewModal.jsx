import Modal from './Modal';
import { getInitials, fullName, fullAddress } from '../utils/format';

export default function UserViewModal({ isOpen, onClose, user }) {
  if (!user) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User details" size="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <span className="avatar" style={{ width: 48, height: 48, fontSize: 15 }}>
          {getInitials(fullName(user))}
        </span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{fullName(user)}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>@{user.username}</div>
        </div>
      </div>
      <DetailRow label="Email" value={user.email} />
      <DetailRow label="Phone" value={user.phone} />
      <DetailRow label="Address" value={fullAddress(user)} />
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-soft)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: 'right', maxWidth: '65%' }}>{value || '—'}</span>
    </div>
  );
}

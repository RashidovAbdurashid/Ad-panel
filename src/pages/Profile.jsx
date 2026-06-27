import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2, FiMail, FiPhone, FiMapPin, FiAtSign } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { fetchCurrentUserProfile } from '../services/authService';
import Loader from '../components/Loader';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { fullName, fullAddress, getInitials } from '../utils/format';
import '../styles/shared.css';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchCurrentUserProfile(1);
        if (!active) return;
        setProfile(data);
        setForm({
          firstname: data?.name?.firstname || '',
          lastname: data?.name?.lastname || '',
          email: data?.email || '',
        });
      } catch (error) {
        toast.error(error.message || 'Failed to load profile.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  function handleSave(e) {
    e.preventDefault();
    setProfile((p) => ({
      ...p,
      name: { firstname: form.firstname, lastname: form.lastname },
      email: form.email,
    }));
    toast.success('Profile updated successfully.');
    setEditOpen(false);
  }

  if (isLoading) return <Loader fullScreen={false} label="Loading profile…" size="lg" />;

  const displayName = profile ? fullName(profile) : user?.username;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p className="page-subtitle">Your account details from the Fake Store API.</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-card-top">
          <span className="avatar profile-avatar">{getInitials(displayName)}</span>
          <div>
            <h2 className="profile-name">{displayName}</h2>
            <span className="profile-username mono">@{profile?.username}</span>
          </div>
          <Button variant="secondary" icon={<FiEdit2 size={14} />} onClick={() => setEditOpen(true)} className="profile-edit-btn">
            Edit Profile
          </Button>
        </div>

        <div className="profile-details">
          <ProfileDetail icon={<FiMail size={15} />} label="Email" value={profile?.email} />
          <ProfileDetail icon={<FiPhone size={15} />} label="Phone" value={profile?.phone} />
          <ProfileDetail icon={<FiAtSign size={15} />} label="Username" value={profile?.username && `@${profile.username}`} />
          <ProfileDetail icon={<FiMapPin size={15} />} label="Address" value={profile ? fullAddress(profile) : '—'} />
        </div>
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save changes</Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={handleSave}>
          <div className="form-field">
            <label htmlFor="firstname">First name</label>
            <input
              id="firstname"
              value={form.firstname}
              onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))}
            />
          </div>
          <div className="form-field">
            <label htmlFor="lastname">Last name</label>
            <input
              id="lastname"
              value={form.lastname}
              onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))}
            />
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ProfileDetail({ icon, label, value }) {
  return (
    <div className="profile-detail-row">
      <div className="profile-detail-icon">{icon}</div>
      <div>
        <div className="profile-detail-label">{label}</div>
        <div className="profile-detail-value">{value || '—'}</div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService';
import Button from '../components/Button';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import UserFormModal from '../components/UserFormModal';
import UserViewModal from '../components/UserViewModal';
import useDebounce from '../hooks/useDebounce';
import { fullName, getInitials } from '../utils/format';
import '../styles/shared.css';

const PAGE_SIZE = 6;

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState({ open: false, user: null });
  const [viewModal, setViewModal] = useState({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = users;
    if (q) {
      list = list.filter((u) =>
        [fullName(u), u.username, u.email, u.phone].join(' ').toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      let av, bv;
      if (sort.key === 'name') {
        av = fullName(a).toLowerCase();
        bv = fullName(b).toLowerCase();
      } else {
        av = (a[sort.key] || '').toLowerCase?.() ?? a[sort.key];
        bv = (b[sort.key] || '').toLowerCase?.() ?? b[sort.key];
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, debouncedQuery, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  async function handleSubmitUser(payload) {
    setIsSaving(true);
    try {
      if (formModal.user) {
        const updated = await updateUser(formModal.user.id, payload);
        setUsers((prev) => prev.map((u) => (u.id === formModal.user.id ? { ...u, ...updated, id: formModal.user.id } : u)));
        toast.success('User updated successfully.');
      } else {
        const created = await createUser(payload);
        setUsers((prev) => [...prev, { ...payload, id: created?.id || Date.now() }]);
        toast.success('User added successfully.');
      }
      setFormModal({ open: false, user: null });
    } catch (error) {
      toast.error(error.message || 'Could not save the user.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.user) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteModal.user.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteModal.user.id));
      toast.success('User deleted successfully.');
      setDeleteModal({ open: false, user: null });
    } catch (error) {
      toast.error(error.message || 'Could not delete the user.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">{users.length} registered users from the Fake Store API.</p>
        </div>
        <Button icon={<FiPlus size={16} />} onClick={() => setFormModal({ open: true, user: null })}>
          Add User
        </Button>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <FiSearch size={15} />
            <input
              placeholder="Search by name, username, or email…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="table-card">
        {isLoading ? (
          <Loader label="Loading users…" size="lg" />
        ) : pageItems.length === 0 ? (
          <EmptyState
            title="No users found"
            message={query ? 'Try a different search term.' : 'Add your first user to get started.'}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortableHeader label="Name" sortKey="name" sort={sort} onClick={toggleSort} />
                    <SortableHeader label="Username" sortKey="username" sort={sort} onClick={toggleSort} />
                    <SortableHeader label="Email" sortKey="email" sort={sort} onClick={toggleSort} />
                    <th>Phone</th>
                    <th>Address</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          <span className="avatar">{getInitials(fullName(user))}</span>
                          <div className="user-cell-text">
                            <span className="cell-primary">{fullName(user)}</span>
                          </div>
                        </div>
                      </td>
                      <td>@{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>{user.address?.city || '—'}</td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn icon-btn--accent" onClick={() => setViewModal({ open: true, user })} aria-label="View user">
                            <FiEye size={15} />
                          </button>
                          <button className="icon-btn" onClick={() => setFormModal({ open: true, user })} aria-label="Edit user">
                            <FiEdit2 size={14} />
                          </button>
                          <button className="icon-btn icon-btn--danger" onClick={() => setDeleteModal({ open: true, user })} aria-label="Delete user">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '0 18px 16px' }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </div>
          </>
        )}
      </div>

      <UserFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, user: null })}
        onSubmit={handleSubmitUser}
        initialUser={formModal.user}
        isSaving={isSaving}
      />

      <UserViewModal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, user: null })} user={viewModal.user} />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete user"
        message={`Are you sure you want to delete "${fullName(deleteModal.user)}"? This action cannot be undone.`}
      />
    </div>
  );
}

function SortableHeader({ label, sortKey, sort, onClick }) {
  const active = sort.key === sortKey;
  return (
    <th className="sortable" onClick={() => onClick(sortKey)}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active && (sort.dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />)}
      </span>
    </th>
  );
}

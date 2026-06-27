import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { getCarts, createCart, updateCart, deleteCart } from '../services/cartService';
import Button from '../components/Button';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import CartFormModal from '../components/CartFormModal';
import CartViewModal from '../components/CartViewModal';
import useDebounce from '../hooks/useDebounce';
import { formatDate, totalCartQuantity } from '../utils/format';
import '../styles/shared.css';
import './CartList.css';

const PAGE_SIZE = 6;

export default function CartList() {
  const [carts, setCarts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [sort, setSort] = useState({ key: 'id', dir: 'desc' });
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState({ open: false, cart: null });
  const [viewModal, setViewModal] = useState({ open: false, cart: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, cart: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCarts();
  }, []);

  async function loadCarts() {
    setIsLoading(true);
    try {
      const data = await getCarts();
      setCarts(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load carts.');
    } finally {
      setIsLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = carts;
    if (q) {
      list = list.filter((c) =>
        [`#${c.id}`, `user ${c.userId}`, formatDate(c.date)].join(' ').toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      let av, bv;
      if (sort.key === 'items') {
        av = totalCartQuantity(a.products);
        bv = totalCartQuantity(b.products);
      } else if (sort.key === 'date') {
        av = new Date(a.date).getTime();
        bv = new Date(b.date).getTime();
      } else {
        av = a[sort.key];
        bv = b[sort.key];
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [carts, debouncedQuery, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  async function handleSubmitCart(payload) {
    setIsSaving(true);
    try {
      if (formModal.cart) {
        const updated = await updateCart(formModal.cart.id, payload);
        setCarts((prev) =>
          prev.map((c) => (c.id === formModal.cart.id ? { ...c, ...updated, id: formModal.cart.id } : c))
        );
        toast.success('Cart updated successfully.');
      } else {
        const created = await createCart(payload);
        setCarts((prev) => [...prev, { ...payload, id: created?.id || Date.now() }]);
        toast.success('Cart added successfully.');
      }
      setFormModal({ open: false, cart: null });
    } catch (error) {
      toast.error(error.message || 'Could not save the cart.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.cart) return;
    setIsDeleting(true);
    try {
      await deleteCart(deleteModal.cart.id);
      setCarts((prev) => prev.filter((c) => c.id !== deleteModal.cart.id));
      toast.success('Cart deleted successfully.');
      setDeleteModal({ open: false, cart: null });
    } catch (error) {
      toast.error(error.message || 'Could not delete the cart.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Cart List</h1>
          <p className="page-subtitle">{carts.length} carts from the Fake Store API.</p>
        </div>
        <Button icon={<FiPlus size={16} />} onClick={() => setFormModal({ open: true, cart: null })}>
          Add Cart
        </Button>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <FiSearch size={15} />
            <input
              placeholder="Search by cart, user, or date…"
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
          <Loader label="Loading carts…" size="lg" />
        ) : pageItems.length === 0 ? (
          <EmptyState
            title="No carts found"
            message={query ? 'Try a different search term.' : 'Add your first cart to get started.'}
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortableHeader label="Cart ID" sortKey="id" sort={sort} onClick={toggleSort} />
                    <SortableHeader label="User ID" sortKey="userId" sort={sort} onClick={toggleSort} />
                    <SortableHeader label="Date" sortKey="date" sort={sort} onClick={toggleSort} />
                    <th>Products</th>
                    <SortableHeader label="Quantity" sortKey="items" sort={sort} onClick={toggleSort} />
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((cart) => (
                    <tr key={cart.id}>
                      <td className="cell-primary mono">#{cart.id}</td>
                      <td className="mono">{cart.userId}</td>
                      <td>{formatDate(cart.date)}</td>
                      <td>
                        <span className="badge badge--secondary">{cart.products?.length || 0} items</span>
                      </td>
                      <td className="mono">{totalCartQuantity(cart.products)}</td>
                      <td>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="icon-btn icon-btn--accent"
                            onClick={() => setViewModal({ open: true, cart })}
                            aria-label="View cart"
                          >
                            <FiEye size={15} />
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => setFormModal({ open: true, cart })}
                            aria-label="Edit cart"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => setDeleteModal({ open: true, cart })}
                            aria-label="Delete cart"
                          >
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

      <CartFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, cart: null })}
        onSubmit={handleSubmitCart}
        initialCart={formModal.cart}
        isSaving={isSaving}
      />

      <CartViewModal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, cart: null })} cart={viewModal.cart} />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, cart: null })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete cart"
        message={`Are you sure you want to delete cart #${deleteModal.cart?.id}? This action cannot be undone.`}
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

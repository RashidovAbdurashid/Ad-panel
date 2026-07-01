import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiPlus, FiSearch, FiEye, FiEdit2, FiTrash2,
  FiChevronUp, FiChevronDown, FiStar,
} from 'react-icons/fi';
import {
  getProducts, createProduct, updateProduct,
  deleteProduct, getProductCategories,
} from '../services/productService';
import Button from '../components/Button';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import ProductFormModal from '../components/ProductFormModal';
import ProductViewModal from '../components/ProductViewModal';
import useDebounce from '../hooks/useDebounce';
import '../styles/shared.css';
import './Products.css';

const PAGE_SIZE = 8;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);

  const [formModal, setFormModal] = useState({ open: false, product: null });
  const [viewModal, setViewModal] = useState({ open: false, product: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, product: null });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [prods, cats] = await Promise.all([getProducts(), getProductCategories()]);
        setProducts(prods);
        setCategories(cats);
      } catch (error) {
        toast.error(error.message || 'Failed to load products.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let list = products;

    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (q) {
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av = a[sort.key];
      let bv = b[sort.key];
      if (sort.key === 'rating') { av = a.rating?.rate ?? 0; bv = b.rating?.rate ?? 0; }
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, debouncedQuery, categoryFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  function toggleSort(key) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  }

  async function handleSubmitProduct(values) {
    setIsSaving(true);
    try {
      const payload = { ...values, price: Number(values.price) };
      if (formModal.product) {
        const updated = await updateProduct(formModal.product.id, payload);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === formModal.product.id
              ? { ...p, ...payload, id: formModal.product.id, rating: p.rating }
              : p
          )
        );
        toast.success('Product updated successfully.');
      } else {
        const created = await createProduct(payload);
        setProducts((prev) => [
          ...prev,
          { ...payload, id: created?.id || Date.now(), rating: { rate: 0, count: 0 } },
        ]);
        toast.success('Product added successfully.');
      }
      setFormModal({ open: false, product: null });
    } catch (error) {
      toast.error(error.message || 'Could not save the product.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.product) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteModal.product.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteModal.product.id));
      toast.success('Product deleted successfully.');
      setDeleteModal({ open: false, product: null });
    } catch (error) {
      toast.error(error.message || 'Could not delete the product.');
    } finally {
      setIsDeleting(false);
    }
  }

  const categoryLabel = (cat) => cat.charAt(0).toUpperCase() + cat.slice(1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p className="page-subtitle">{products.length} products from the Fake Store API.</p>
        </div>
        <Button
          icon={<FiPlus size={16} />}
          onClick={() => setFormModal({ open: true, product: null })}
        >
          Add Product
        </Button>
      </div>

      <div className="page-toolbar">
        <div className="toolbar-left">
          <div className="search-input">
            <FiSearch size={15} />
            <input
              placeholder="Search by title or description…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${categoryFilter === 'all' ? 'filter-tab--active' : ''}`}
              onClick={() => { setCategoryFilter('all'); setPage(1); }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-tab ${categoryFilter === cat ? 'filter-tab--active' : ''}`}
                onClick={() => { setCategoryFilter(cat); setPage(1); }}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loader label="Loading products…" size="lg" />
      ) : pageItems.length === 0 ? (
        <EmptyState
          title="No products found"
          message={query || categoryFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Add your first product to get started.'}
        />
      ) : (
        <>
          <div className="products-list">
            {pageItems.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onView={() => setViewModal({ open: true, product })}
                onEdit={() => setFormModal({ open: true, product })}
                onDelete={() => setDeleteModal({ open: true, product })}
              />
            ))}
          </div>

          <div className="products-list-footer">
            <div className="products-sort-bar">
              <span className="products-sort-label">Sort by</span>
              {[
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Name' },
                { key: 'price', label: 'Price' },
                { key: 'rating', label: 'Rating' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`sort-chip ${sort.key === key ? 'sort-chip--active' : ''}`}
                  onClick={() => toggleSort(key)}
                >
                  {label}
                  {sort.key === key && (
                    sort.dir === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />
                  )}
                </button>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
            />
          </div>
        </>
      )}

      <ProductFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, product: null })}
        onSubmit={handleSubmitProduct}
        initialProduct={formModal.product}
        isSaving={isSaving}
      />

      <ProductViewModal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, product: null })}
        product={viewModal.product}
      />

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, product: null })}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete product"
        message={`Are you sure you want to delete "${deleteModal.product?.title}"? This cannot be undone.`}
      />
    </div>
  );
}

function ProductListItem({ product, onView, onEdit, onDelete }) {
  const rating = product.rating?.rate ?? 0;
  const count = product.rating?.count ?? 0;

  return (
    <div className="product-item">
      <div className="product-item-thumb">
        <img src={product.image} alt={product.title} loading="lazy" />
      </div>

      <div className="product-item-body">
        <div className="product-item-top">
          <span className="badge badge--secondary product-item-category">
            {product.category}
          </span>
          <span className="product-item-id mono">#{product.id}</span>
        </div>
        <h3 className="product-item-title">{product.title}</h3>
        <p className="product-item-desc">{product.description}</p>
        <div className="product-item-meta">
          <span className="product-item-price">${Number(product.price).toFixed(2)}</span>
          {rating > 0 && (
            <span className="product-item-rating">
              <FiStar size={12} />
              {rating.toFixed(1)}
              <span className="product-item-rating-count">({count})</span>
            </span>
          )}
        </div>
      </div>

      <div className="product-item-actions">
        <button className="icon-btn icon-btn--accent" onClick={onView} aria-label="View product">
          <FiEye size={15} />
        </button>
        <button className="icon-btn" onClick={onEdit} aria-label="Edit product">
          <FiEdit2 size={14} />
        </button>
        <button className="icon-btn icon-btn--danger" onClick={onDelete} aria-label="Delete product">
          <FiTrash2 size={14} />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import Modal from './Modal';
import Loader from './Loader';
import EmptyState from './EmptyState';
import { getProducts } from '../services/productService';

export default function ProductPickerModal({ isOpen, onClose, onSelect }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setIsLoading(true);
    getProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((error) => {
        toast.error(error.message || 'Failed to load products.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, query]);

  function handleSelect(product) {
    onSelect(product);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose a product" size="lg">
      <div className="search-input product-picker-search">
        <FiSearch size={15} />
        <input
          placeholder="Search products by name or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading ? (
        <Loader label="Loading products…" size="lg" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search term." />
      ) : (
        <div className="product-picker-grid">
          {filtered.map((product) => (
            <button
              type="button"
              key={product.id}
              className="product-picker-card"
              onClick={() => handleSelect(product)}
            >
              <span className="product-picker-thumb">
                <img src={product.image} alt={product.title} loading="lazy" />
              </span>
              <span className="product-picker-info">
                <span className="product-picker-title">{product.title}</span>
                <span className="product-picker-meta">
                  <span className="product-picker-price">${product.price.toFixed(2)}</span>
                  <span className="badge badge--secondary">{product.category}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

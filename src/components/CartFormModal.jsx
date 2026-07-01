import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiPackage } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';
import ProductPickerModal from './ProductPickerModal';
import { getProducts } from '../services/productService';

function toFormState(cart) {
  return {
    userId: cart?.userId ? String(cart.userId) : '1',
    date: cart?.date ? cart.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    products:
      cart?.products?.length > 0
        ? cart.products.map((p) => ({ productId: p.productId, quantity: String(p.quantity) }))
        : [],
  };
}

export default function CartFormModal({ isOpen, onClose, onSubmit, initialCart, isSaving }) {
  const isEdit = Boolean(initialCart);
  const [form, setForm] = useState(toFormState(initialCart));
  const [errors, setErrors] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setForm(toFormState(initialCart));
    setErrors({});
  }, [initialCart, isOpen]);

  // Fetch the product catalog once so existing rows (e.g. when editing a
  // cart) can be enriched with an image/title, not just a bare productId.
  useEffect(() => {
    if (!isOpen || catalog.length > 0) return;
    getProducts()
      .then(setCatalog)
      .catch((error) => toast.error(error.message || 'Failed to load product catalog.'));
  }, [isOpen, catalog.length]);

  const catalogById = useMemo(() => {
    const map = new Map();
    catalog.forEach((p) => map.set(p.id, p));
    return map;
  }, [catalog]);

  function updateQuantity(index, value) {
    setForm((f) => {
      const products = f.products.map((p, i) => (i === index ? { ...p, quantity: value } : p));
      return { ...f, products };
    });
  }

  function removeProductRow(index) {
    setForm((f) => ({ ...f, products: f.products.filter((_, i) => i !== index) }));
  }

  function handlePickProduct(product) {
    setForm((f) => {
      const existingIndex = f.products.findIndex((p) => p.productId === product.id);
      if (existingIndex !== -1) {
        // Already in the cart — just bump the quantity instead of duplicating the row.
        const products = f.products.map((p, i) =>
          i === existingIndex ? { ...p, quantity: String(Number(p.quantity || 0) + 1) } : p
        );
        return { ...f, products };
      }
      return { ...f, products: [...f.products, { productId: product.id, quantity: '1' }] };
    });
    setCatalog((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
  }

  function validate() {
    const next = {};
    if (!form.userId || Number(form.userId) <= 0) next.userId = 'User ID is required';
    if (!form.date) next.date = 'Date is required';
    if (form.products.length === 0) next.products = 'Add at least one product';
    form.products.forEach((p, i) => {
      if (!p.quantity || Number(p.quantity) <= 0) next[`quantity-${i}`] = 'Quantity must be at least 1';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      userId: Number(form.userId),
      date: new Date(form.date).toISOString(),
      products: form.products.map((p) => ({
        productId: p.productId,
        quantity: Number(p.quantity),
      })),
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit cart' : 'Add new cart'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving}>
            {isEdit ? 'Save changes' : 'Add cart'}
          </Button>
        </>
      }
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="userId">User ID</label>
          <input
            id="userId"
            type="number"
            min="1"
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
          />
          {errors.userId && <span className="form-field-error">{errors.userId}</span>}
        </div>
        <div className="form-field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          {errors.date && <span className="form-field-error">{errors.date}</span>}
        </div>

        <div className="form-field form-field--full">
          <div className="product-rows-header">
            <label>Products</label>
            <button type="button" className="add-product-btn" onClick={() => setPickerOpen(true)}>
              <FiPlus size={14} /> Add product
            </button>
          </div>
          {errors.products && <span className="form-field-error">{errors.products}</span>}

          {form.products.length === 0 ? (
            <div className="product-rows-empty">
              <FiPackage size={18} />
              <span>No products yet — click "Add product" to choose from the catalog.</span>
            </div>
          ) : (
            <div className="product-rows">
              {form.products.map((p, index) => {
                const product = catalogById.get(p.productId);
                return (
                  <div className="product-row product-row--picked" key={`${p.productId}-${index}`}>
                    <span className="product-row-thumb">
                      {product ? (
                        <img src={product.image} alt={product.title} loading="lazy" />
                      ) : (
                        <FiPackage size={16} />
                      )}
                    </span>
                    <div className="product-row-details">
                      <span className="product-row-title">
                        {product ? product.title : `Product #${p.productId}`}
                      </span>
                      <span className="product-row-subtitle mono">
                        ID {p.productId}
                        {product ? ` · $${product.price.toFixed(2)}` : ''}
                      </span>
                    </div>
                    <div className="product-row-field product-row-field--qty">
                      <span className="product-row-label">Qty</span>
                      <input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                      />
                      {errors[`quantity-${index}`] && (
                        <span className="form-field-error">{errors[`quantity-${index}`]}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger product-row-remove"
                      onClick={() => removeProductRow(index)}
                      aria-label="Remove product"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>

      <ProductPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePickProduct}
      />
    </Modal>
  );
}

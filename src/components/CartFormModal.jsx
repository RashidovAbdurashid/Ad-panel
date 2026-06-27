import { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';

function toFormState(cart) {
  return {
    userId: cart?.userId ? String(cart.userId) : '1',
    date: cart?.date ? cart.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    products:
      cart?.products?.length > 0
        ? cart.products.map((p) => ({ productId: String(p.productId), quantity: String(p.quantity) }))
        : [{ productId: '1', quantity: '1' }],
  };
}

export default function CartFormModal({ isOpen, onClose, onSubmit, initialCart, isSaving }) {
  const isEdit = Boolean(initialCart);
  const [form, setForm] = useState(toFormState(initialCart));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(toFormState(initialCart));
    setErrors({});
  }, [initialCart, isOpen]);

  function updateProduct(index, field, value) {
    setForm((f) => {
      const products = f.products.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      return { ...f, products };
    });
  }

  function addProductRow() {
    setForm((f) => ({ ...f, products: [...f.products, { productId: '1', quantity: '1' }] }));
  }

  function removeProductRow(index) {
    setForm((f) => ({ ...f, products: f.products.filter((_, i) => i !== index) }));
  }

  function validate() {
    const next = {};
    if (!form.userId || Number(form.userId) <= 0) next.userId = 'User ID is required';
    if (!form.date) next.date = 'Date is required';
    if (form.products.length === 0) next.products = 'Add at least one product';
    form.products.forEach((p, i) => {
      if (!p.productId || Number(p.productId) <= 0) next[`product-${i}`] = 'Product ID is required';
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
        productId: Number(p.productId),
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
          <label>Products</label>
          {errors.products && <span className="form-field-error">{errors.products}</span>}
          <div className="product-rows">
            {form.products.map((p, index) => (
              <div className="product-row" key={index}>
                <div className="product-row-field">
                  <span className="product-row-label">Product ID</span>
                  <input
                    type="number"
                    min="1"
                    value={p.productId}
                    onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                  />
                  {errors[`product-${index}`] && (
                    <span className="form-field-error">{errors[`product-${index}`]}</span>
                  )}
                </div>
                <div className="product-row-field product-row-field--qty">
                  <span className="product-row-label">Qty</span>
                  <input
                    type="number"
                    min="1"
                    value={p.quantity}
                    onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                  />
                  {errors[`quantity-${index}`] && (
                    <span className="form-field-error">{errors[`quantity-${index}`]}</span>
                  )}
                </div>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger product-row-remove"
                  onClick={() => removeProductRow(index)}
                  disabled={form.products.length === 1}
                  aria-label="Remove product"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-product-btn" onClick={addProductRow}>
            <FiPlus size={14} /> Add product
          </button>
        </div>
      </form>
    </Modal>
  );
}

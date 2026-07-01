import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiShoppingBag, FiPackage } from 'react-icons/fi';
import Modal from './Modal';
import { formatDate, totalCartQuantity } from '../utils/format';
import { getProducts } from '../services/productService';

export default function CartViewModal({ isOpen, onClose, cart }) {
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    getProducts()
      .then(setCatalog)
      .catch((error) => toast.error(error.message || 'Failed to load product details.'));
  }, [isOpen]);

  const catalogById = useMemo(() => {
    const map = new Map();
    catalog.forEach((p) => map.set(p.id, p));
    return map;
  }, [catalog]);

  if (!cart) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cart #${cart.id}`} size="sm">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <span
          className="avatar"
          style={{ width: 48, height: 48, fontSize: 17, background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <FiShoppingBag size={20} />
        </span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Cart #{cart.id}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>User #{cart.userId} · {formatDate(cart.date)}</div>
        </div>
      </div>

      <div className="cart-view-products">
        {cart.products?.map((p, i) => {
          const product = catalogById.get(p.productId);
          return (
            <div className="cart-view-product-row cart-view-product-row--img" key={i}>
              <span className="cart-view-product-thumb">
                {product ? (
                  <img src={product.image} alt={product.title} loading="lazy" />
                ) : (
                  <FiPackage size={14} />
                )}
              </span>
              <span className="cart-view-product-title">
                {product ? product.title : `Product #${p.productId}`}
              </span>
              <span className="mono">×{p.quantity}</span>
            </div>
          );
        })}
      </div>

      <div className="cart-view-total">
        <span>Total items</span>
        <span className="mono">{totalCartQuantity(cart.products)}</span>
      </div>
    </Modal>
  );
}

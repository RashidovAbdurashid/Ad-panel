import { FiShoppingBag } from 'react-icons/fi';
import Modal from './Modal';
import { formatDate, totalCartQuantity } from '../utils/format';

export default function CartViewModal({ isOpen, onClose, cart }) {
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
        <div className="cart-view-products-header">
          <span>Product</span>
          <span>Quantity</span>
        </div>
        {cart.products?.map((p, i) => (
          <div className="cart-view-product-row" key={i}>
            <span>Product #{p.productId}</span>
            <span className="mono">{p.quantity}</span>
          </div>
        ))}
      </div>

      <div className="cart-view-total">
        <span>Total items</span>
        <span className="mono">{totalCartQuantity(cart.products)}</span>
      </div>
    </Modal>
  );
}

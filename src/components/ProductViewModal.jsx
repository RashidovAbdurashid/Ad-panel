import { FiStar, FiTag } from 'react-icons/fi';
import Modal from './Modal';

export default function ProductViewModal({ isOpen, onClose, product }) {
  if (!product) return null;
  const rating = product.rating?.rate ?? 0;
  const count = product.rating?.count ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product details" size="md">
      <div className="product-view">
        <div className="product-view-image">
          <img src={product.image} alt={product.title} />
        </div>

        <div className="product-view-body">
          <div className="product-view-category">
            <FiTag size={12} />
            <span>{product.category}</span>
          </div>

          <h2 className="product-view-title">{product.title}</h2>

          <div className="product-view-meta">
            <span className="product-view-price">${Number(product.price).toFixed(2)}</span>
            {rating > 0 && (
              <span className="product-view-rating">
                <FiStar size={13} />
                <span>{rating.toFixed(1)}</span>
                <span className="product-view-rating-count">({count})</span>
              </span>
            )}
          </div>

          <p className="product-view-description">{product.description}</p>

          <div className="product-view-id mono">ID #{product.id}</div>
        </div>
      </div>
    </Modal>
  );
}

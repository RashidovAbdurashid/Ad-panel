import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './Pagination.css';

export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = [];
  const maxButtons = 5;
  let from = Math.max(1, page - 2);
  let to = Math.min(totalPages, from + maxButtons - 1);
  if (to - from < maxButtons - 1) from = Math.max(1, to - maxButtons + 1);
  for (let i = from; i <= to; i++) pages.push(i);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing <strong>{start}–{end}</strong> of <strong>{totalItems}</strong>
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>
        {from > 1 && <span className="pagination-ellipsis">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            className={`pagination-btn ${p === page ? 'pagination-btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page}
          >
            {p}
          </button>
        ))}
        {to < totalPages && <span className="pagination-ellipsis">…</span>}
        <button
          className="pagination-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

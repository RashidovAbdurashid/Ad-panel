export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function fullName(user) {
  if (!user) return '—';
  if (user.name && (user.name.firstname || user.name.lastname)) {
    return `${user.name.firstname || ''} ${user.name.lastname || ''}`.trim();
  }
  return user.username || '—';
}

export function fullAddress(user) {
  const addr = user?.address;
  if (!addr) return '—';
  const parts = [
    addr.number && addr.street ? `${addr.number} ${addr.street}` : addr.street,
    addr.city,
    addr.zipcode,
  ].filter(Boolean);
  return parts.join(', ') || '—';
}

export function totalCartQuantity(products = []) {
  return products.reduce((sum, p) => sum + (p.quantity || 0), 0);
}

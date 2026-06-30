import api from './api';

export async function getProducts() {
  const { data } = await api.get('/products');
  return data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

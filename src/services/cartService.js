import api from './api';

export async function getCarts() {
  const { data } = await api.get('/carts');
  return data;
}

export async function getCart(id) {
  const { data } = await api.get(`/carts/${id}`);
  return data;
}

export async function createCart(payload) {
  const { data } = await api.post('/carts', payload);
  return data;
}

export async function updateCart(id, payload) {
  const { data } = await api.put(`/carts/${id}`, payload);
  return data;
}

export async function deleteCart(id) {
  const { data } = await api.delete(`/carts/${id}`);
  return data;
}

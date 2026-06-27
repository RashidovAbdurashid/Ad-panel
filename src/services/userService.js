import api from './api';

export async function getUsers() {
  const { data } = await api.get('/users');
  return data;
}

export async function getUser(id) {
  const { data } = await api.get(`/users/${id}`);
  return data;
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload);
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

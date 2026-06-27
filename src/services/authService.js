import api from './api';

export async function loginRequest(username, password) {
  const { data } = await api.post('/auth/login', { username, password });
  return data; // { token }
}

export async function fetchCurrentUserProfile(userId = 1) {
  // Fake Store API has no "me" endpoint, so we fetch a representative user
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

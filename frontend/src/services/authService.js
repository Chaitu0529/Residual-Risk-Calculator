import axios from 'axios';

const BASE = '/auth';

export const authService = {
  async login(username, password) {
    const res = await axios.post(`${BASE}/login`, { username, password });
    return res.data;
  },

  async register(data) {
    const res = await axios.post(`${BASE}/register`, data);
    return res.data;
  },

  async refresh(refreshToken) {
    const res = await axios.post(`${BASE}/refresh`, { refreshToken });
    return res.data;
  },

  async logout() {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        await axios.post(
          `${BASE}/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch {
        // Proceed with local logout regardless
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
};

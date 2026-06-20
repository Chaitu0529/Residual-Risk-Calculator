import api from '../lib/axios';

export const auditService = {
  async getAll(params = {}) {
    const res = await api.get('/audit', { params });
    return res.data;
  },

  async getRecent() {
    const res = await api.get('/audit/recent');
    return res.data;
  },

  async getByUser(username) {
    const res = await api.get(`/audit/user/${username}`);
    return res.data;
  },
};

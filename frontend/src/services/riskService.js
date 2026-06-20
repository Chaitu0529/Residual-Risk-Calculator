import api from '../lib/axios';

export const riskService = {
  // ── List & Search ──────────────────────────────────────────────
  async getAll(params = {}) {
    const res = await api.get('/risks', { params });
    return res.data;
  },

  async search(params = {}) {
    const res = await api.get('/risks/search', { params });
    return res.data;
  },

  async getById(id) {
    const res = await api.get(`/risks/${id}`);
    return res.data;
  },

  // ── CRUD ───────────────────────────────────────────────────────
  async create(data) {
    const res = await api.post('/risks', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/risks/${id}`, data);
    return res.data;
  },

  async delete(id) {
    const res = await api.delete(`/risks/${id}`);
    return res.data;
  },

  // ── Dashboard ─────────────────────────────────────────────────
  async getStats() {
    const res = await api.get('/stats');
    return res.data;
  },

  // ── AI ────────────────────────────────────────────────────────
  async generateDescription(id) {
    const res = await api.post(`/risks/${id}/ai/describe`);
    return res.data;
  },

  async generateRecommendations(id) {
    const res = await api.post(`/risks/${id}/ai/recommend`);
    return res.data;
  },

  async generateReport(id) {
    const res = await api.post(`/risks/${id}/ai/report`);
    return res.data;
  },

  // ── File Upload ────────────────────────────────────────────────
  async uploadFile(id, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/risks/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // ── Export ─────────────────────────────────────────────────────
  async exportCsv() {
    const token = localStorage.getItem('accessToken');
    const res = await api.get('/export/csv', {
      baseURL: '',
      responseType: 'blob',
      headers: {
        Accept: 'text/csv',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  },
};

export const CATEGORIES = [
  'FINANCIAL',
  'OPERATIONAL',
  'CYBER_SECURITY',
  'COMPLIANCE',
  'REPUTATIONAL',
  'STRATEGIC',
  'TECHNOLOGY',
  'SUPPLY_CHAIN',
  'HUMAN_RESOURCES',
  'LEGAL',
];

export const STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'MITIGATED',
  'ACCEPTED',
  'CLOSED',
];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

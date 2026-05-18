import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: adiciona JWT em cada requisicao
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: trata 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authService = {
  login: (cpf, senha) =>
    api.post('/api/auth/login', { cpf, senha }),
  cadastro: (dados) =>
    api.post('/api/auth/cadastro', dados),
  me: () =>
    api.get('/api/auth/me'),
};

// ============ SOLICITACOES ============
export const ocorrenciaService = {
  criar: (dados) =>
    api.post('/api/solicitacoes', dados),
  listar: (params) =>
    api.get('/api/solicitacoes', { params }),
  minhas: (params) =>
    api.get('/api/solicitacoes/minhas', { params }),
  buscarPorId: (id) =>
    api.get(`/api/solicitacoes/${id}`),
  buscarPorProtocolo: (protocolo) =>
    api.get(`/api/solicitacoes/protocolo/${protocolo}`),
  atualizarStatus: (id, dados) =>
    api.put(`/api/solicitacoes/${id}/status`, dados),
};

// ============ DASHBOARD ============
export const dashboardService = {
  stats: () =>
    api.get('/api/admin/dashboard'),
};

// ============ EQUIPES ============
export const equipeService = {
  listar: () =>
    api.get('/api/equipes'),
};

// ============ ORGAOS ============
export const orgaoService = {
  listar: () =>
    api.get('/api/orgaos'),
};

// ============ SERVICOS ============
export const servicoService = {
  listar: () =>
    api.get('/api/servicos'),
};

export default api;


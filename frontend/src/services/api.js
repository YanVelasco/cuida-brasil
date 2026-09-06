import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
  listarNaoAtribuidas: () =>
    api.get('/api/solicitacoes/nao-atribuidas'),
  cidadaos: () =>
    api.get('/api/solicitacoes/cidadaos'),
  minhas: (params) =>
    api.get('/api/solicitacoes/minhas', { params }),
  buscarPorId: (id) =>
    api.get(`/api/solicitacoes/${id}`),
  buscarPorProtocolo: (protocolo) =>
    api.get(`/api/solicitacoes/protocolo/${protocolo}`),
  atualizarEndereco: (id, endereco) =>
    api.patch(`/api/solicitacoes/${id}/endereco`, { endereco }),
  atualizarStatus: (id, dados) =>
    api.put(`/api/solicitacoes/${id}/status`, dados),
  excluir: (id) =>
    api.delete(`/api/solicitacoes/${id}`),
  avaliar: (id, dados) =>
    api.post(`/api/solicitacoes/${id}/avaliar`, dados),
};

// ============ ANEXOS ============
export const anexoService = {
  upload: (solicitacaoId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/solicitacoes/${solicitacaoId}/anexos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listar: (solicitacaoId) =>
    api.get(`/api/solicitacoes/${solicitacaoId}/anexos`),
  download: (anexoId) =>
    api.get(`/api/anexos/${anexoId}/download`, { responseType: 'blob' }),
  excluir: (anexoId) =>
    api.delete(`/api/anexos/${anexoId}`),
};

// ============ USUARIOS ============
export const usuarioService = {
  listarCidadaos: () =>
    api.get('/api/usuarios/cidadaos'),
};

// ============ AUDITORIA ============
export const auditoriaService = {
  listar: (params) =>
    api.get('/api/auditoria', { params }),
  resumoLogins: () =>
    api.get('/api/auditoria/resumo-logins'),
};

// ============ DASHBOARD ============
export const dashboardService = {
  // Dashboard do GESTOR (filtra pela equipe do gestor autenticado)
  stats: () =>
    api.get('/api/admin/dashboard'),
  // Dashboard do ADMIN (totais gerais do sistema)
  statsAdmin: () =>
    api.get('/api/admin/system-dashboard'),
};

// ============ RELATORIOS ============
export const relatorioService = {
  resumo: (params) => api.get('/api/relatorios/resumo', { params }),
  porCategoria: (params) => api.get('/api/relatorios/por-categoria', { params }),
  porStatus: (params) => api.get('/api/relatorios/por-status', { params }),
  tendenciaMensal: (params) => api.get('/api/relatorios/tendencia-mensal', { params }),
  indicadores: () => api.get('/api/relatorios/indicadores'),
  matrizIA: () => api.get('/api/relatorios/matriz-ia'),
  territorial: () => api.get('/api/relatorios/territorial'),
};

export const chatService = {
  ask: (message) => api.post('/api/chat/ask', { message }),
};

export const gestorService = {
  listar: () =>
    api.get('/api/gestores'),
  atualizarLocalizacao: (dados) =>
    api.put('/api/gestores/localizacao', dados),
};

// ============ EQUIPES ============
export const equipeService = {
  listar: () =>
    api.get('/api/equipes'),
  dashboard: (params) =>
    api.get('/api/equipes/dashboard', { params }),
  listarMembros: (id, params) =>
    api.get(`/api/equipes/${id}/membros`, { params }),
  criar: (dados) =>
    api.post('/api/equipes', dados),
  adicionarMembro: (id, dados) =>
    api.post(`/api/equipes/${id}/membros`, dados),
  removerMembro: (membroId) =>
    api.delete(`/api/equipes/membros/${membroId}`),
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

import { createContext, useContext, useState, useEffect } from 'react';
import { authService, authUtils } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token && !authUtils.isTokenExpired(token) && saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    } else {
      authUtils.clearSessionAndRedirect(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (cpf, senha) => {
    const res = await authService.login(cpf, senha);
    const { token, ...userData } = res.data.data;
    if (authUtils.isTokenExpired(token)) {
      throw new Error('Token expirado recebido do servidor.');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const cadastro = async (dados) => {
    const res = await authService.cadastro(dados);
    const { token, ...userData } = res.data.data;
    if (authUtils.isTokenExpired(token)) {
      throw new Error('Token expirado recebido do servidor.');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authUtils.clearSessionAndRedirect(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, cadastro, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

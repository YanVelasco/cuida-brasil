import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, Mail, Phone, Lock, IdCard } from 'lucide-react';
import styles from './Cadastro.module.css';

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nomeCompleto:'', cpf:'', email:'', telefone:'', senha:'', senhaConfirm:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const formatCPF = (v) => v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');

  const formatPhone = (v) => v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.senha !== form.senhaConfirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true); setError('');
    try {
      await authService.cadastro({ nome: form.nomeCompleto, cpf: form.cpf, email: form.email, senha: form.senha });
      navigate('/login');
    } catch (err) { 
      setError(err.response?.data?.message || 'Erro ao criar conta. CPF ou e-mail já cadastrado.'); 
    }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>C+</div>
        <h1>
          <span style={{color: 'var(--primary)'}}>Cuidar</span>
          <span style={{color: 'var(--success)'}}>+Brasil</span>
        </h1>
      </div>

      <div className={styles.card}>
        <h2>Criar minha conta</h2>
        <p>Preencha os dados abaixo para se registrar</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input id="nome" label="Nome Completo" placeholder="Seu nome completo" value={form.nomeCompleto} onChange={set('nomeCompleto')} icon={<User size={16}/>} required/>
          <Input id="cpf" label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm(f=>({...f,cpf:formatCPF(e.target.value)}))} icon={<IdCard size={16}/>} required/>
          <Input id="email" label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={set('email')} icon={<Mail size={16}/>} required/>
          <Input id="tel" label="Telefone" placeholder="(00) 00000-0000" value={form.telefone} onChange={(e)=>setForm(f=>({...f,telefone:formatPhone(e.target.value)}))} icon={<Phone size={16}/>} required/>
          <Input id="senha" label="Senha" type="password" placeholder="Mínimo 6 caracteres" value={form.senha} onChange={set('senha')} icon={<Lock size={16}/>} required/>
          <Input id="senhaC" label="Confirmar Senha" type="password" placeholder="Repita a senha" value={form.senhaConfirm} onChange={set('senhaConfirm')} icon={<Lock size={16}/>} required/>
          {error && <p className={styles.error}>{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>{loading ? 'Criando...' : 'CRIAR CONTA'}</Button>
        </form>

        <p className={styles.login}>Já tem conta? <Link to="/login">Faça login</Link></p>
      </div>
    </div>
  );
}

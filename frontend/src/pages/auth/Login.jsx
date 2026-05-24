import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User, Lock } from 'lucide-react';
import styles from './Login.module.css';

export default function Login() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const formatCPF = (v) =>
    v.replace(/\D/g,'').slice(0,11)
     .replace(/(\d{3})(\d)/,'$1.$2')
     .replace(/(\d{3})(\d)/,'$1.$2')
     .replace(/(\d{3})(\d{1,2})$/,'$1-$2');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(cpf, senha);
      navigate(user?.perfil === 'ADMIN' ? '/admin' : '/app');
    } catch {
      setError('CPF ou senha inválidos.');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      {/* Left - Splash */}
      <div className={styles.splash}>
        {/* City illustration */}
        <div className={styles.illustration}>
          <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ground */}
            <ellipse cx="90" cy="145" rx="75" ry="12" fill="rgba(255,255,255,0.1)"/>
            {/* Buildings */}
            <rect x="10" y="80" width="28" height="65" rx="3" fill="#1a4a8a"/>
            <rect x="12" y="85" width="6" height="8" fill="#4a8fd4" opacity="0.7"/>
            <rect x="22" y="85" width="6" height="8" fill="#4a8fd4" opacity="0.4"/>
            <rect x="12" y="100" width="6" height="8" fill="#4a8fd4" opacity="0.6"/>
            <rect x="22" y="100" width="6" height="8" fill="#4a8fd4" opacity="0.8"/>
            {/* Tall center building */}
            <rect x="50" y="40" width="35" height="105" rx="3" fill="#1351B4"/>
            <rect x="53" y="50" width="7" height="10" fill="#4a8fd4" opacity="0.6"/>
            <rect x="64" y="50" width="7" height="10" fill="#4a8fd4" opacity="0.8"/>
            <rect x="75" y="50" width="7" height="10" fill="#4a8fd4" opacity="0.5"/>
            <rect x="53" y="70" width="7" height="10" fill="#4a8fd4" opacity="0.7"/>
            <rect x="64" y="70" width="7" height="10" fill="#fff" opacity="0.9"/>
            <rect x="75" y="70" width="7" height="10" fill="#4a8fd4" opacity="0.6"/>
            <rect x="53" y="90" width="7" height="10" fill="#4a8fd4" opacity="0.5"/>
            <rect x="64" y="90" width="7" height="10" fill="#4a8fd4" opacity="0.7"/>
            <rect x="75" y="90" width="7" height="10" fill="#fff" opacity="0.9"/>
            {/* Right building */}
            <rect x="98" y="60" width="32" height="85" rx="3" fill="#0d3880"/>
            <rect x="101" y="68" width="7" height="9" fill="#4a8fd4" opacity="0.6"/>
            <rect x="112" y="68" width="7" height="9" fill="#fff" opacity="0.8"/>
            <rect x="101" y="85" width="7" height="9" fill="#4a8fd4" opacity="0.5"/>
            <rect x="112" y="85" width="7" height="9" fill="#4a8fd4" opacity="0.7"/>
            {/* Small right */}
            <rect x="140" y="90" width="24" height="55" rx="3" fill="#1a4a8a"/>
            <rect x="143" y="96" width="5" height="7" fill="#4a8fd4" opacity="0.5"/>
            <rect x="152" y="96" width="5" height="7" fill="#fff" opacity="0.7"/>
            {/* Trees */}
            <circle cx="42" cy="138" r="8" fill="#27AE60"/>
            <rect x="40" y="138" width="4" height="7" fill="#1a7a40"/>
            <circle cx="135" cy="136" r="7" fill="#27AE60"/>
            <rect x="133" y="136" width="4" height="7" fill="#1a7a40"/>
            {/* Star/glow on top center building */}
            <circle cx="67" cy="35" r="5" fill="#F2C94C" opacity="0.9"/>
            <circle cx="67" cy="35" r="3" fill="#fff"/>
          </svg>
        </div>

        <div className={styles.brandName}>
          <span style={{color: 'var(--primary)'}}>CUIDAR</span>
          <span className={styles.plus} style={{color: 'var(--success)'}}>+</span>
          <span style={{color: 'var(--success)'}}>BRASIL</span>
        </div>
        <p className={styles.brandLocation}>ZELADORA URBANA - CANAL DO CIDADÃO</p>
        <p className={styles.brandTagline}>Sua cidade está limpa, com sua participação.</p>
      </div>

      {/* Right - Form */}
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            Bem-vindo(a) ao{' '}
            <span className={styles.brandInline}>
              <span style={{color: 'var(--primary)'}}>Cuidar</span>
              <span style={{color: 'var(--success)'}}>+Brasil</span>
            </span>
          </h2>
          <p className={styles.cardSub}>Acesse com o seu CPF e senha ou entre via GOV.BR</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <Input id="cpf" label="CPF" placeholder="000.000.000-00"
              value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))}
              icon={<User size={16}/>} required/>
            <Input id="senha" label="Senha" type="password" placeholder="Sua senha"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              icon={<Lock size={16}/>} required/>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar com conta'}
            </Button>
          </form>

          <Button variant="outline" fullWidth onClick={() => alert('Integração GOV.BR em breve')}>
            Entrar com gov.br
          </Button>

          <p className={styles.register}>
            Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
          <p className={styles.terms}>
            Ao entrar, você aceita os <a href="#">Termos de Uso</a> e <a href="#">Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
}


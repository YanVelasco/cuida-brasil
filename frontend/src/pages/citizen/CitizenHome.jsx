import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Home, Plus, MapPin, User, Bell, LogOut, Moon, Sun } from 'lucide-react';
import styles from './CitizenHome.module.css';

// Mapeamento de status da API para rótulos amigáveis e estilos
const STATUS_MAP = {
  'PENDENTE':     { label: 'Pendente',     bg: 'var(--warning-light)', color: 'var(--warning)', border: 'var(--warning)' },
  'TRIAGEM':      { label: 'Em Análise',   bg: 'var(--primary-light)', color: 'var(--primary)', border: 'var(--primary)' },
  'EM_ANDAMENTO': { label: 'Em Andamento', bg: '#EBF3FF',              color: '#1351B4',         border: '#1351B4' },
  'EM_CAMPO':     { label: 'Em Campo',     bg: '#E8F5E9',              color: '#27AE60',         border: '#27AE60' },
  'CONCLUIDA':    { label: 'Resolvido',    bg: 'var(--success-light)', color: 'var(--success)', border: 'var(--success)' },
  'CANCELADA':    { label: 'Cancelado',    bg: '#FEE2E2',              color: '#EF4444',         border: '#EF4444' },
};

export default function CitizenHome() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [ocorrencias, setOcorrencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carrega APENAS as solicitações do cidadão autenticado via token
    ocorrenciaService.minhas({ page: 0, size: 20 })
      .then(r => {
        const content = r.data?.data?.content || r.data?.content || [];
        setOcorrencias(content);
      })
      .catch(err => {
        console.error('Erro ao carregar ocorrências:', err);
        setOcorrencias([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Calcula as estatísticas a partir dos dados reais da API
  const stats = useMemo(() => {
    const abertas = ocorrencias.filter(o =>
      ['PENDENTE', 'TRIAGEM'].includes(o.status)
    ).length;
    const andamento = ocorrencias.filter(o =>
      ['EM_ANDAMENTO', 'EM_CAMPO'].includes(o.status)
    ).length;
    const resolvidas = ocorrencias.filter(o => o.status === 'CONCLUIDA').length;
    return [
      { label: 'Abertas',    value: abertas,   color: '#F2994A' },
      { label: 'Andamento',  value: andamento, color: '#2F80ED' },
      { label: 'Resolvidas', value: resolvidas, color: '#27AE60' },
    ];
  }, [ocorrencias]);

  return (
    <MobileLayout>
      {/* Top header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.logoRow}>
            <div className={styles.logoIllustration}>
              <svg width="64" height="56" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className={styles.logoTextWrapper}>
              <span className={styles.logoText}>
                <span style={{color: 'var(--primary)'}}>CUIDAR</span> <span style={{color: 'var(--success)'}}>+ BRASIL</span>
              </span>
              <span className={styles.logoSub}>Zeladoria Urbana</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} onClick={toggleTheme} title="Alternar Tema">
              {theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>}
            </button>
            <button className={styles.iconBtn}><Bell size={18}/></button>
            <button className={styles.iconBtn} onClick={logout} title="Sair"><LogOut size={18}/></button>
          </div>
        </div>
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>{user?.nome?.[0] ?? 'U'}</div>
          <div>
            <p className={styles.userGreet}>Bem-vindo,</p>
            <p className={styles.userName}>{user?.nome?.split(' ')[0] ?? 'Cidadão'}</p>
          </div>
        </div>
        {/* Stats bar — calculada a partir dos dados reais */}
        <div className={styles.statsBar}>
          {stats.map(s => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue} style={{color: s.color}}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Grid Container */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: Minhas Ocorrências */}
        <div className={styles.leftCol}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>Minhas Ocorrências</span>
              <Link to="/app/nova-solicitacao" className={styles.verTodas}>+ Nova</Link>
            </div>

            <div className={styles.ocorrenciasList}>
              {loading && (
                <p style={{ color: 'var(--text-secondary)', padding: '12px', fontSize: '0.85rem' }}>
                  Carregando...
                </p>
              )}
              {!loading && ocorrencias.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', padding: '12px', fontSize: '0.85rem' }}>
                  Você ainda não tem solicitações. Clique em "+ Nova" para registrar um problema!
                </p>
              )}
              {ocorrencias.map(oc => {
                const st = STATUS_MAP[oc.status] || { label: oc.status, bg: '#f1f5f9', color: '#666', border: '#ccc' };
                return (
                  <Link key={oc.id} to={"/app/protocolo/" + oc.id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div className={styles.cardInfo}>
                        <p className={styles.cardTitle}>{oc.categoriaServico} — {oc.subcategoriaServico}</p>
                        <p className={styles.cardLocal}>{oc.protocolo} · {oc.gps}</p>
                      </div>
                      <span className={styles.statusBadge} style={{background: st.bg, color: st.color, borderColor: st.border}}>
                        {st.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Nova Ocorrência Banner & Ações Rápidas */}
        <div className={styles.rightCol}>
          <Link to="/app/nova-solicitacao" className={styles.banner}>
            <div>
              <p className={styles.bannerTitle}>Nova Ocorrência</p>
              <p className={styles.bannerSub}>Registre um problema na sua cidade</p>
            </div>
            <span className={styles.bannerArrow}>→</span>
          </Link>

          {/* Quick tips & shortcuts (Wow element) */}
          <div className={styles.communityCard}>
            <h3 className={styles.communityTitle}>Colaboração Cidadã</h3>
            <p className={styles.communityText}>
              Seja os olhos da prefeitura no seu bairro! Ao registrar uma solicitação com foto e localização detalhadas, nossas equipes de campo agilizam o atendimento.
            </p>
            
            <div className={styles.phoneList}>
              <h4 className={styles.phoneTitle}>Contatos Úteis</h4>
              <div className={styles.phoneItem}>
                <span>Ouvidoria Municipal</span>
                <strong>156</strong>
              </div>
              <div className={styles.phoneItem}>
                <span>Defesa Civil</span>
                <strong>199</strong>
              </div>
              <div className={styles.phoneItem}>
                <span>SAMU</span>
                <strong>192</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

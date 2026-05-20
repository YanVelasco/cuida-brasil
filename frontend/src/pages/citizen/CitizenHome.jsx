import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import { Home, Plus, MapPin, User, Bell, LogOut } from 'lucide-react';
import styles from './CitizenHome.module.css';

const MOCK = [
  { id: 1, titulo: 'Buraco na via pública', categoria: 'Infraestrutura', status: 'Em Andamento', local: 'Rua XXXXXX, XXX - Jardim XXXX', data: '10/05/2024' },
  { id: 2, titulo: 'Iluminação pública com defeito', categoria: 'Iluminação', status: 'Em Análise', local: 'Rua XXXXXX, XXX - Jardim XXXX', data: '08/05/2024' },
  { id: 3, titulo: 'Iluminação de patrimônio público', categoria: 'Patrimônio', status: 'Resolvido', local: 'Rua XXXXXX, XXX - Jardim XXXX', data: '05/05/2024' },
];

const STATUS_STYLE = {
  'Em Andamento': { bg: '#E8F1FD', color: '#2F80ED', border:'#2F80ED' },
  'Em Análise':   { bg: '#FEF3E7', color: '#F2994A', border:'#F2994A' },
  'Resolvido':    { bg: '#E8F7EE', color: '#27AE60', border:'#27AE60' },
};

const NAV_ICONS = [
  { icon: '⊞', label: 'Home', to: '/app' },
  { icon: '◻', label: 'Novo', to: '/app/nova-solicitacao', special: true },
  { icon: '📍', label: 'Mapa', to: '/app/protocolo' },
  { icon: '👤', label: 'Perfil', to: '/app/avaliar' },
];

export default function CitizenHome() {
  const { user, logout } = useAuth();
  const [ocorrencias, setOcorrencias] = useState(MOCK);

  useEffect(() => {
    ocorrenciaService.listar()
      .then(r => { if (r.data?.length) setOcorrencias(r.data); })
      .catch(() => {});
  }, []);

  return (
    <MobileLayout hideNav>
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
              <span className={styles.logoText}>CUIDAR + BRASIL</span>
              <span className={styles.logoSub}>Zeladoria Urbana</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn}><Bell size={18}/></button>
            <button className={styles.iconBtn} onClick={logout} title="Sair"><LogOut size={18}/></button>
          </div>
        </div>
        <div className={styles.userRow}>
          <div className={styles.userAvatar}>{user?.nome?.[0] ?? 'U'}</div>
          <div>
            <p className={styles.userGreet}>Bem-vindo,</p>
            <p className={styles.userName}>{user?.nome?.split(' ')[0] ?? 'Usuário B.'}</p>
          </div>
        </div>
        {/* Stats bar */}
        <div className={styles.statsBar}>
          {[{label:'Abertas',value:3,color:'#F2994A'},{label:'Em Análise',value:1,color:'#2F80ED'},{label:'Resolvidas',value:12,color:'#27AE60'}].map(s => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statValue} style={{color:s.color}}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nova Ocorrência Banner */}
      <Link to="/app/nova-solicitacao" className={styles.banner}>
        <div>
          <p className={styles.bannerTitle}>Nova Ocorrência</p>
          <p className={styles.bannerSub}>Registre um problema na sua cidade</p>
        </div>
        <span className={styles.bannerArrow}>→</span>
      </Link>

      {/* Minhas Ocorrências */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Minhas Ocorrências</span>
          <button className={styles.verTodas}>Ver Todas</button>
        </div>

        {ocorrencias.map(oc => {
          const st = STATUS_STYLE[oc.status] || { bg: '#f1f5f9', color: '#666', border: '#ccc' };
          return (
            <Link key={oc.id} to={"/app/protocolo/" + oc.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardInfo}>
                  <p className={styles.cardTitle}>{oc.titulo}</p>
                  <p className={styles.cardLocal}>{oc.local}</p>
                </div>
                <span className={styles.statusBadge} style={{background: st.bg, color: st.color, borderColor: st.border}}>
                  {oc.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Nav */}
      <nav className={styles.bottomNav}>
        {NAV_ICONS.map((n, i) => (
          <Link key={i} to={n.to} className={[styles.navItem, n.special ? styles.navSpecial : ''].join(' ')}>
            <span className={styles.navIcon}>{n.icon}</span>
            {!n.special && <span className={styles.navLabel}>{n.label}</span>}
          </Link>
        ))}
      </nav>
    </MobileLayout>
  );
}


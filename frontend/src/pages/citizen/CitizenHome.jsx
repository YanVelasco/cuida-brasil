import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import { Home, Plus, MapPin, User, Bell } from 'lucide-react';
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
            <div className={styles.logoIcon}>C+</div>
            <span className={styles.logoText}>Cuidar + Brasil</span>
          </div>
          <button className={styles.bellBtn}><Bell size={18}/></button>
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


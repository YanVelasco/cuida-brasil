import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, X } from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_SECTIONS = [
  {
    label: 'PRINCIPAL',
    items: [
      { to: '/admin', label: 'Dashboard', end: true },
      { to: '/admin/mapa', label: 'Mapa de Ocorrências' },
      { to: '/admin/solicitacoes', label: 'Solicitações', badge: '24' },
      { to: '/admin/equipes', label: 'Gestão de Equipes' },
    ]
  },
  {
    label: 'CONFIGURAÇÃO',
    items: [
      { to: '/admin/orgaos', label: 'Órgãos Públicos' },
      { to: '/admin/integracoes', label: 'Integrações API' },
      { to: '/admin/relatorios', label: 'Relatórios' },
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={[styles.sidebar, isOpen ? styles.open : ''].join(' ')}>
      {/* Mobile Close Button */}
      <button className={styles.closeBtn} onClick={onClose} title="Fechar Menu">
        <X size={18} />
      </button>

      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIllustration}>
          <svg width="120" height="106" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>
            <span style={{color: 'var(--primary)'}}>CUIDAR</span> <span style={{color: 'var(--success)'}}>+ BRASIL</span>
          </div>
          <div className={styles.logoSub}>Zeladoria Urbana</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className={styles.sectionLabel}>{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => [styles.navItem, isActive ? styles.active : ''].join(' ')}
                onClick={onClose}
              >
                <span className={styles.checkbox} />
                <span>{item.label}</span>
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.nome?.[0] ?? 'A'}</div>
          <div>
            <div className={styles.userName}>{user?.nome?.split(' ')[0] ?? 'Usuário A.'}</div>
            <div className={styles.userRole}>Gestor</div>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Sair">
          <LogOut size={15}/>
        </button>
      </div>
    </aside>
  );
}


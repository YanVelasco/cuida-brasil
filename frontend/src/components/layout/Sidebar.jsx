import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
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

export default function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>C+</span>
        </div>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>CUIDAR + BRASIL</div>
          <div className={styles.logoSub}>ZELADORA URBANA</div>
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

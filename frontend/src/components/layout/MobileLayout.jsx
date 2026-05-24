import { NavLink } from 'react-router-dom';
import BottomNav from './BottomNav';
import styles from './MobileLayout.module.css';

const NAV_ITEMS = [
  { to: '/app', label: 'Início', end: true },
  { to: '/app/nova-solicitacao', label: 'Nova Ocorrência' },
  { to: '/app/protocolo', label: 'Protocolos' },
  { to: '/app/avaliar', label: 'Avaliar' },
];

export default function MobileLayout({ children, title, hideNav }) {
  return (
    <div className={styles.container}>
      {/* Header desktop premium */}
      <header className={styles.desktopHeader}>
        <div className={styles.logoRow}>
          <svg width="40" height="36" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="90" cy="145" rx="75" ry="12" fill="rgba(0,0,0,0.06)"/>
            <rect x="10" y="80" width="28" height="65" rx="3" fill="#1a4a8a"/>
            <rect x="12" y="85" width="6" height="8" fill="#4a8fd4" opacity="0.7"/>
            <rect x="22" y="85" width="6" height="8" fill="#4a8fd4" opacity="0.4"/>
            <rect x="12" y="100" width="6" height="8" fill="#4a8fd4" opacity="0.6"/>
            <rect x="22" y="100" width="6" height="8" fill="#4a8fd4" opacity="0.8"/>
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
            <rect x="98" y="60" width="32" height="85" rx="3" fill="#0d3880"/>
            <rect x="101" y="68" width="7" height="9" fill="#4a8fd4" opacity="0.6"/>
            <rect x="112" y="68" width="7" height="9" fill="#fff" opacity="0.8"/>
            <rect x="101" y="85" width="7" height="9" fill="#4a8fd4" opacity="0.5"/>
            <rect x="112" y="85" width="7" height="9" fill="#4a8fd4" opacity="0.7"/>
            <rect x="140" y="90" width="24" height="55" rx="3" fill="#1a4a8a"/>
            <rect x="143" y="96" width="5" height="7" fill="#4a8fd4" opacity="0.5"/>
            <rect x="152" y="96" width="5" height="7" fill="#fff" opacity="0.7"/>
            <circle cx="42" cy="138" r="8" fill="#27AE60"/>
            <rect x="40" y="138" width="4" height="7" fill="#1a7a40"/>
            <circle cx="135" cy="136" r="7" fill="#27AE60"/>
            <rect x="133" y="136" width="4" height="7" fill="#1a7a40"/>
            <circle cx="67" cy="35" r="5" fill="#F2C94C" opacity="0.9"/>
            <circle cx="67" cy="35" r="3" fill="#fff"/>
          </svg>
          <div className={styles.logoTextWrapper}>
            <span className={styles.logoText}>
              <span style={{color: 'var(--primary)'}}>CUIDAR</span> <span style={{color: 'var(--success)'}}>+ BRASIL</span>
            </span>
            <span className={styles.logoSub}>Zeladoria Urbana</span>
          </div>
        </div>
        <nav className={styles.desktopNav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
          <div className={styles.navDivider} />
          <button className={styles.librasBtn}>🤟 VLibras</button>
        </nav>
      </header>

      {title && (
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
        </header>
      )}
      <div className={styles.content}>{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}


import { NavLink } from 'react-router-dom';
import { Home, Plus, FileText, Star } from 'lucide-react';
import styles from './BottomNav.module.css';

const NAV = [
  { to: '/app', icon: <Home size={22}/>, label: 'Início', end: true },
  { to: '/app/nova-solicitacao', icon: <Plus size={22}/>, label: 'Nova', special: true },
  { to: '/app/protocolo', icon: <FileText size={22}/>, label: 'Protocolos' },
  { to: '/app/avaliar', icon: <Star size={22}/>, label: 'Avaliar' },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav}>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => [styles.item, isActive ? styles.active : '', item.special ? styles.special : ''].join(' ')}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

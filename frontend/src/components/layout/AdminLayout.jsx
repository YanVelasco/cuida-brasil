import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.topBarBtn} onClick={toggleTheme} title="Alternar Tema">
            {theme === 'light' ? <><Moon size={16}/> Modo Escuro</> : <><Sun size={16}/> Modo Claro</>}
          </button>
          <div className={styles.divider}/>
          <button className={styles.topBarBtn}>🤟 VLibras</button>
          <select className={styles.regionSelect}>
            <option>Selecionar região</option>
            <option>Centro</option>
            <option>Norte</option>
            <option>Sul</option>
            <option>Leste</option>
            <option>Oeste</option>
          </select>
          <button className={styles.exportBtn}>Exportar</button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

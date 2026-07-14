import { useState } from 'react';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Menu, FileDown, Accessibility } from 'lucide-react';
import useLocationTracker from '../../hooks/useLocationTracker';
import { useRegion } from '../../contexts/RegionContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { selectedRegion, setSelectedRegion } = useRegion();

  // Inicializa o rastreamento em background se for Gestor
  useLocationTracker();

  return (
    <>
      <div className={styles.layout}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {isSidebarOpen && (
        <div 
          className={styles.sidebarBackdrop} 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <main className={styles.main}>
        <div className={styles.topBar}>
          <button 
            className={styles.menuToggle} 
            onClick={() => setIsSidebarOpen(true)} 
            title="Abrir Menu"
          >
            <Menu size={20} />
          </button>
          
          <button className={styles.topBarBtn} onClick={toggleTheme} title="Alternar Tema">
            {theme === 'light' ? <><Moon size={16}/> Modo Escuro</> : <><Sun size={16}/> Modo Claro</>}
          </button>
          <div className={styles.divider}/>
          <select 
            className={styles.regionSelect} 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="">Todas as Regiões</option>
            <option value="Centro">Centro</option>
            <option value="Norte">Norte</option>
            <option value="Sul">Sul</option>
            <option value="Leste">Leste</option>
            <option value="Oeste">Oeste</option>
          </select>
          <button className={styles.exportBtn} onClick={() => window.print()}>
            <FileDown size={16} style={{marginRight: 6}}/> Exportar
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
    </>
  );
}


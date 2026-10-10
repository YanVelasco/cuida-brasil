import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Menu, FileDown, Accessibility } from 'lucide-react';
import useLocationTracker from '../../hooks/useLocationTracker';
import { useRegion } from '../../contexts/RegionContext';
import { relatorioService } from '../../services/api';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { selectedRegion, setSelectedRegion, availableRegions, setAvailableRegions } = useRegion();
  const location = useLocation();
  const showOccurrenceRegionFilter = location.pathname !== '/admin/equipes';

  // Inicializa o rastreamento em background se for Gestor
  useLocationTracker();

  useEffect(() => {
    let active = true;
    relatorioService.territorial()
      .then(response => {
        const data = response.data?.data || response.data || [];
        const options = [...new Set(data
          .map(item => item.regiao)
          .filter(region => region && region !== 'Não informada'))]
          .sort((a, b) => a.localeCompare(b, 'pt-BR'));
        if (active) {
          setAvailableRegions(options);
          if (selectedRegion && !options.includes(selectedRegion)) setSelectedRegion('');
        }
      })
      .catch(() => { if (active) setAvailableRegions([]); });

    return () => { active = false; };
  }, [location.pathname]);

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
          {showOccurrenceRegionFilter && (
            <select
              className={styles.regionSelect}
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              aria-label="Filtrar por bairro ou região das ocorrências"
            >
              <option value="">Todas as Regiões</option>
              {availableRegions.map(region => <option key={region} value={region}>{region}</option>)}
            </select>
          )}
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


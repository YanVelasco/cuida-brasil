import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import styles from './MapaOcorrencias.module.css';

const OCORRENCIAS = [
  { id:1, x:22, y:18, titulo:'Buraco Rua ABC', status:'urgente', color:'#EB5757' },
  { id:2, x:48, y:30, titulo:'Lâmpada apagada', status:'pendente', color:'#F2994A' },
  { id:3, x:70, y:22, titulo:'Entulho irregular', status:'em_campo', color:'#2F80ED' },
  { id:4, x:38, y:48, titulo:'Vazamento Rua XV', status:'urgente', color:'#EB5757' },
  { id:5, x:62, y:52, titulo:'Calçada danificada', status:'resolvido', color:'#27AE60' },
  { id:6, x:15, y:55, titulo:'Poste sem luz', status:'pendente', color:'#F2994A' },
  { id:7, x:80, y:60, titulo:'Entulho Av. Norte', status:'em_campo', color:'#2F80ED' },
  { id:8, x:28, y:72, titulo:'Tapa-buraco urgente', status:'urgente', color:'#EB5757' },
  { id:9, x:55, y:78, titulo:'Poda de árvore', status:'resolvido', color:'#27AE60' },
  { id:10, x:75, y:40, titulo:'Bueiro entupido', status:'pendente', color:'#F2994A' },
  { id:11, x:45, y:62, titulo:'Buraco central', status:'urgente', color:'#EB5757' },
  { id:12, x:35, y:85, titulo:'Limpeza urgente', status:'em_campo', color:'#6B4EFF' },
];

const PRIO_FILTERS = [
  { label: 'Urgente', color: '#EB5757', bg: '#FEE8E8' },
  { label: 'Alta', color: '#F2994A', bg: '#FEF3E7' },
  { label: 'Média', color: '#2F80ED', bg: '#E8F1FD' },
  { label: 'Baixa', color: '#27AE60', bg: '#E8F7EE' },
];

export default function MapaOcorrencias() {
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Mapa de Ocorrências</h1>
      </div>

      <div className={styles.layout}>
        {/* Map Area */}
        <div className={styles.mapWrapper}>
          <div className={styles.mapArea}>
            {/* Grid lines */}
            <div className={styles.gridLines}>
              {[25,50,75].map(p => (
                <div key={'v'+p} className={styles.vLine} style={{left:p+'%'}}/>
              ))}
              {[25,50,75].map(p => (
                <div key={'h'+p} className={styles.hLine} style={{top:p+'%'}}/>
              ))}
            </div>

            {/* Heat circle around center */}
            <div className={styles.heatCircle}/>
            <div className={styles.heatLabel}>5</div>

            {/* Zoom controls */}
            <div className={styles.zoomControls}>
              <button className={styles.zoomBtn}>+</button>
              <button className={styles.zoomBtn}>−</button>
            </div>

            {/* Pins */}
            {OCORRENCIAS.map(oc => (
              <button
                key={oc.id}
                className={[styles.pin, selected?.id===oc.id ? styles.pinActive : ''].join(' ')}
                style={{ left: oc.x+'%', top: oc.y+'%', background: oc.color }}
                onClick={() => setSelected(selected?.id===oc.id ? null : oc)}
                title={oc.titulo}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>FILTROS</div>
            <select className={styles.sideSelect}><option>Tipo de ocorrência</option></select>
            <select className={styles.sideSelect}><option>Região / Bairro</option></select>
            <div className={styles.prioFilters}>
              {PRIO_FILTERS.map(f => (
                <button
                  key={f.label}
                  className={[styles.prioBtn, activeFilter===f.label ? styles.prioBtnActive : ''].join(' ')}
                  style={{
                    borderColor: f.color,
                    color: activeFilter===f.label ? '#fff' : f.color,
                    background: activeFilter===f.label ? f.color : 'transparent'
                  }}
                  onClick={() => setActiveFilter(activeFilter===f.label ? null : f.label)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>OCORRÊNCIA SELECIONADA</div>
            {selected ? (
              <div className={styles.selectedCard}>
                <div className={styles.selectedBar} style={{background:'#333', height: 10, borderRadius: 4, marginBottom: 8}}/>
                <div className={styles.selectedBar} style={{background:'#eee', height: 8, borderRadius: 4, width:'60%', marginBottom: 10}}/>
                <span className={styles.urgentBadge} style={{background: selected.color}}>
                  {selected.status === 'urgente' ? 'Urgente' : selected.status.replace('_',' ')}
                </span>
                <p className={styles.selectedTitle}>{selected.titulo}</p>
                <div className={styles.selectedImg}/>
              </div>
            ) : (
              <div className={styles.noSelected}>
                <div className={styles.selectedBar} style={{background:'#333', height: 10, borderRadius: 4, marginBottom: 8}}/>
                <div className={styles.selectedBar} style={{background:'#eee', height: 8, borderRadius: 4, width:'60%', marginBottom: 10}}/>
                <span className={styles.urgentBadge} style={{background:'var(--danger)'}}>Urgente</span>
                <div className={styles.selectedImg}/>
              </div>
            )}
            <button className={styles.blueBtn}>Atribuir equipe</button>
            <button className={styles.outlineBtn}>Ver detalhes</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

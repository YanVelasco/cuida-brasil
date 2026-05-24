import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  LineChart, Line, ResponsiveContainer, Tooltip
} from 'recharts';
import { MapPin, CheckCircle, Shield } from 'lucide-react';
import styles from './Equipes.module.css';

const KPI_CARDS = [
  { label:'EQUIPES ATIVAS', value:18, sub:'↑ 3 sobre mês', color:'blue' },
  { label:'EM CAMPO', value:12, sub:'67% do total', color:'green' },
  { label:'DISPONÍVEL', value:4, sub:'22% do total', color:'gray' },
  { label:'EM DESLOCAMENTO', value:2, sub:'11% do total', color:'orange' },
  { label:'SOBRECARREGADAS', value:3, sub:'17% do total', color:'red' },
];

const EQUIPES = [
  { id:'EQP-01', nome:'Equipe Pavimentação 01', supervisor:'xxxxxxxxxx', tecnicos:'6 técnicos', tipo:'Tapa-buraco / Pavimento', regiao:'Centro', casos:14, status:'Em campo', sla:'90%', statusColor:'#27AE60' },
  { id:'EQP-02', nome:'Equipe Iluminação 02', supervisor:'xxxxxxxxxx', tecnicos:'4 técnicos', tipo:'Iluminação pública', regiao:'Sul', casos:8, status:'Em campo', sla:'94%', statusColor:'#27AE60' },
  { id:'EQP-03', nome:'Equipe Varrição 03', supervisor:'xxxxxxxxxx', tecnicos:'8 técnicos', tipo:'Limpeza / Varrição', regiao:'Norte', casos:22, status:'Em campo', sla:'78%', statusColor:'#27AE60' },
  { id:'EQP-02', nome:'Equipe Poda 02', supervisor:'xxxxxxxxxx', tecnicos:'5 técnicos', tipo:'Poda de árvores', regiao:'Oeste', casos:31, status:'Sobrecarr.', sla:'65%', statusColor:'#EB5757' },
  { id:'EQP-01', nome:'Equipe Drenagem 01', supervisor:'xxxxxxxxxx', tecnicos:'7 técnicos', tipo:'Bueiros / Drenagem', regiao:'Leste', casos:3, status:'Disponível', sla:'58%', statusColor:'#F2C94C' },
];

const MINI_DATA = [
  {v:40},{v:55},{v:48},{v:62},{v:50},{v:58},{v:52}
];

export default function Equipes() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [activeDistrict, setActiveDistrict] = useState(null);

  const handleDistrictHover = (name, stats) => {
    setHoverInfo({
      type: 'district',
      title: name,
      details: stats
    });
  };

  const handlePinHover = (team) => {
    setHoverInfo({
      type: 'team',
      title: team.nome,
      status: team.status,
      supervisor: team.supervisor,
      tipo: team.tipo,
      casos: team.casos,
      sla: team.sla
    });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Gestão de Equipes</h1>
        <button className={styles.newBtn}>+ Nova Equipe</button>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <input className={styles.searchInput} placeholder="Buscar equipe ou supervisor..." value={search} onChange={e=>setSearch(e.target.value)}/>
        {['Região','Tipo de equipe','Status','Turno','Supervisor'].map(f => (
          <select key={f} className={styles.filterSelect}>
            <option>{f === 'Região' || f === 'Tipo de equipe' || f === 'Status' || f === 'Turno' || f === 'Supervisor' ? 'Todos' : f}</option>
          </select>
        ))}
        <button className={styles.clearBtn}>🗑 Limpar filtros</button>
        <button className={styles.mapBtn}>📍 Ver no mapa</button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpis}>
        {KPI_CARDS.map((k,i) => (
          <div key={i} className={[styles.kpiCard, styles[k.color]].join(' ')}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiVal}>{k.value}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>EQUIPE</th><th>SUPERVISOR</th><th>TÉCNICOS</th>
                <th>TIPO DE SERVIÇO</th><th>REGIÃO / ÁREA</th><th>CASOS ABERTOS</th>
                <th>STATUS</th><th>SLA MÉDIO</th><th>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {EQUIPES.map((e,i) => (
                <tr key={i}>
                  <td className={styles.id}>{e.id}</td>
                  <td className={styles.teamName}>{e.nome}</td>
                  <td className={styles.muted}>{e.supervisor}</td>
                  <td className={styles.muted}>{e.tecnicos}</td>
                  <td>{e.tipo}</td>
                  <td>{e.regiao}</td>
                  <td className={styles.center}
                    style={{color: e.casos > 20 ? 'var(--danger)' : 'inherit', fontWeight: e.casos > 20 ? 700 : 400}}>
                    {e.casos}
                  </td>
                  <td>
                    <span className={styles.statusBadge} style={{background: e.statusColor}}>{e.status}</span>
                  </td>
                  <td className={styles.muted}>{e.sla}</td>
                  <td><button className={styles.viewBtn}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className={styles.pagination}>
          <button className={styles.pageBtn} onClick={()=>setPage(Math.max(1,page-1))}>‹</button>
          {[1,2,3,4].map(p => (
            <button key={p} className={[styles.pageBtn, page===p ? styles.pageActive : ''].join(' ')} onClick={()=>setPage(p)}>{p}</button>
          ))}
          <button className={styles.pageBtn} onClick={()=>setPage(Math.min(4,page+1))}>›</button>
          <select className={styles.pageSizeSelect}><option>5 por página</option><option>10 por página</option></select>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomGrid}>
        <div className={styles.mapCard}>
          <div className={styles.mapCardHeader}>
            <h3>Mapa de Alocação</h3>
            <button className={styles.mapZoomBtn}>+</button>
          </div>
          <div className={styles.mapContainer}>
            {/* Interactive Map Overlay/Tooltip */}
            {hoverInfo && (
              <div className={styles.mapTooltip}>
                {hoverInfo.type === 'district' ? (
                  <>
                    <strong style={{fontSize:'0.78rem', display:'block', marginBottom:'2px', color:'var(--primary)'}}>{hoverInfo.title}</strong>
                    <div>{hoverInfo.details}</div>
                  </>
                ) : (
                  <>
                    <strong style={{fontSize:'0.78rem', display:'block', color: hoverInfo.status === 'Sobrecarr.' ? '#EB5757' : 'var(--primary)'}}>{hoverInfo.title}</strong>
                    <div style={{fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px'}}>{hoverInfo.tipo}</div>
                    <div style={{marginTop:'4px'}}>• Supervisor: <strong>{hoverInfo.supervisor}</strong></div>
                    <div>• Casos: <strong>{hoverInfo.casos}</strong> | SLA: <strong>{hoverInfo.sla}</strong></div>
                    <div style={{marginTop:'4px', display:'flex', alignItems:'center', gap:'4px'}}>
                      <span style={{
                        width:'6px', height:'6px', borderRadius:'50%', 
                        background: hoverInfo.status === 'Sobrecarr.' ? '#EB5757' : hoverInfo.status === 'Disponível' ? '#F2C94C' : '#27AE60'
                      }}/>
                      Status: <strong>{hoverInfo.status}</strong>
                    </div>
                  </>
                )}
              </div>
            )}

            <svg viewBox="0 0 360 200" className={styles.mapSvg}>
              {/* District Paths */}
              <path 
                d="M 20 20 L 340 20 L 290 80 L 90 80 Z" 
                className={[styles.districtPath, activeDistrict === 'Norte' ? styles.districtActive : ''].join(' ')}
                onClick={() => setActiveDistrict(activeDistrict === 'Norte' ? null : 'Norte')}
                onMouseEnter={() => handleDistrictHover('Região Norte', '3 equipes ativas | 38 ocorrências')}
                onMouseLeave={handleMouseLeave}
              />
              <path 
                d="M 90 80 L 290 80 L 250 140 L 130 140 Z" 
                className={[styles.districtPath, activeDistrict === 'Centro' ? styles.districtActive : ''].join(' ')}
                onClick={() => setActiveDistrict(activeDistrict === 'Centro' ? null : 'Centro')}
                onMouseEnter={() => handleDistrictHover('Região Centro', '2 equipes ativas | 41 ocorrências')}
                onMouseLeave={handleMouseLeave}
              />
              <path 
                d="M 130 140 L 250 140 L 210 190 L 170 190 Z" 
                className={[styles.districtPath, activeDistrict === 'Sul' ? styles.districtActive : ''].join(' ')}
                onClick={() => setActiveDistrict(activeDistrict === 'Sul' ? null : 'Sul')}
                onMouseEnter={() => handleDistrictHover('Região Sul', '1 equipe ativa | 29 ocorrências')}
                onMouseLeave={handleMouseLeave}
              />
              <path 
                d="M 20 20 L 90 80 L 130 140 L 170 190 L 20 190 Z" 
                className={[styles.districtPath, activeDistrict === 'Oeste' ? styles.districtActive : ''].join(' ')}
                onClick={() => setActiveDistrict(activeDistrict === 'Oeste' ? null : 'Oeste')}
                onMouseEnter={() => handleDistrictHover('Região Oeste', '1 equipe sobrecarregada | 31 ocorrências')}
                onMouseLeave={handleMouseLeave}
              />
              <path 
                d="M 340 20 L 290 80 L 250 140 L 210 190 L 340 190 Z" 
                className={[styles.districtPath, activeDistrict === 'Leste' ? styles.districtActive : ''].join(' ')}
                onClick={() => setActiveDistrict(activeDistrict === 'Leste' ? null : 'Leste')}
                onMouseEnter={() => handleDistrictHover('Região Leste', '1 equipe disponível | 40 ocorrências')}
                onMouseLeave={handleMouseLeave}
              />

              {/* District Labels */}
              <text x="180" y="45" className={styles.districtLabel}>Zona Norte</text>
              <text x="180" y="105" className={styles.districtLabel}>Centro</text>
              <text x="190" y="165" className={styles.districtLabel}>Zona Sul</text>
              <text x="70" y="110" className={styles.districtLabel}>Oeste</text>
              <text x="290" y="110" className={styles.districtLabel}>Leste</text>

              {/* Pulsing Team Markers */}
              {/* EQP-03 (Norte) - status: Em campo (green) */}
              <g className={styles.mapPinGroup} 
                 onMouseEnter={() => handlePinHover(EQUIPES[2])}
                 onMouseLeave={handleMouseLeave}
              >
                <circle cx="200" cy="55" r="10" fill="#27AE60" opacity="0.35" className={styles.pulsingRing} />
                <circle cx="200" cy="55" r="4.5" fill="#27AE60" className={styles.mapPinCircle} />
              </g>

              {/* EQP-01 (Centro) - status: Em campo (green) */}
              <g className={styles.mapPinGroup} 
                 onMouseEnter={() => handlePinHover(EQUIPES[0])}
                 onMouseLeave={handleMouseLeave}
              >
                <circle cx="180" cy="95" r="10" fill="#27AE60" opacity="0.35" className={styles.pulsingRing} />
                <circle cx="180" cy="95" r="4.5" fill="#27AE60" className={styles.mapPinCircle} />
              </g>

              {/* EQP-02 (Sul) - status: Em campo (green) */}
              <g className={styles.mapPinGroup} 
                 onMouseEnter={() => handlePinHover(EQUIPES[1])}
                 onMouseLeave={handleMouseLeave}
              >
                <circle cx="190" cy="150" r="10" fill="#27AE60" opacity="0.35" className={styles.pulsingRing} />
                <circle cx="190" cy="150" r="4.5" fill="#27AE60" className={styles.mapPinCircle} />
              </g>

              {/* EQP-02/Poda (Oeste) - status: Sobrecarr. (red) */}
              <g className={styles.mapPinGroup} 
                 onMouseEnter={() => handlePinHover(EQUIPES[3])}
                 onMouseLeave={handleMouseLeave}
              >
                <circle cx="95" cy="110" r="10" fill="#EB5757" opacity="0.35" className={styles.pulsingRing} />
                <circle cx="95" cy="110" r="4.5" fill="#EB5757" className={styles.mapPinCircle} />
              </g>

              {/* EQP-01/Drenagem (Leste) - status: Disponível (yellow) */}
              <g className={styles.mapPinGroup} 
                 onMouseEnter={() => handlePinHover(EQUIPES[4])}
                 onMouseLeave={handleMouseLeave}
              >
                <circle cx="280" cy="105" r="10" fill="#F2C94C" opacity="0.35" className={styles.pulsingRing} />
                <circle cx="280" cy="105" r="4.5" fill="#F2C94C" className={styles.mapPinCircle} />
              </g>
            </svg>
          </div>
          <div className={styles.mapLegend}>
            {[{l:'Em campo',c:'#27AE60'},{l:'Deslocamento',c:'#2F80ED'},{l:'Pendente',c:'#F2994A'},{l:'Sobrecarregado',c:'#EB5757'}].map(i => (
              <span key={i.l} className={styles.mapLegendItem}><span className={styles.mapLegendDot} style={{background:i.c}}/>{i.l}</span>
            ))}
          </div>
        </div>

        <div className={styles.metricsCard}>
          <h3>Desempenho Operacional</h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <div className={styles.metricLabel}>Ocorrências por região</div>
              <div className={styles.metricDonut}>
                <div className={styles.donutCenter}>148</div>
              </div>
              <div className={styles.regionList}>
                {[{r:'Centro',v:41},{r:'Norte',v:38},{r:'Sul',v:29},{r:'Leste',v:40}].map(r => (
                  <div key={r.r} className={styles.regionRow}>
                    <span>{r.r}</span><strong>{r.v}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.metricBox}>
              <div className={styles.metricLabel}>Serviços concluídos</div>
              <div className={styles.bigNumber}>52</div>
              <div className={styles.metricSub}>+15% vs anterior</div>
              <ResponsiveContainer width="100%" height={50}>
                <LineChart data={MINI_DATA}>
                  <Line type="monotone" dataKey="v" stroke="#27AE60" strokeWidth={2} dot={false}/>
                  <Tooltip/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={styles.bottomMetrics}>
            <div className={styles.bottomMetric}>
              <span className={styles.bmLabel}>Tempo médio de atendimento</span>
              <strong className={styles.bmVal}>3h 20m</strong>
              <div className={styles.bmSub}>↓4% vs anterior</div>
            </div>
            <div className={styles.bottomMetric}>
              <span className={styles.bmLabel}>SLA médio</span>
              <strong className={styles.bmVal}>89%</strong>
              <div className={styles.bmSub}>+3% vs anterior</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { dashboardService, ocorrenciaService } from '../../services/api';
import { useRegion } from '../../contexts/RegionContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis
} from 'recharts';
import styles from './Dashboard.module.css';

const STATUS_STYLE = {
  'EM_ANDAMENTO': { label: 'Andamento',   bg: '#2F80ED', color: '#fff' },
  'EM_CAMPO':     { label: 'Em Campo',    bg: '#27AE60', color: '#fff' },
  'CONCLUIDA':    { label: 'Concluída',   bg: '#6FCF97', color: '#fff' },
  'TRIAGEM':      { label: 'Triagem',     bg: '#F2994A', color: '#fff' },
  'PENDENTE':     { label: 'Pendente',    bg: '#9B51E0', color: '#fff' },
  'CANCELADA':    { label: 'Cancelada',   bg: '#EB5757', color: '#fff' },
};

const PRIO_STYLE = {
  'ALTA':    { bg: '#EB5757', color: '#fff' },
  'MEDIA':   { bg: '#F2C94C', color: '#333' },
  'BAIXA':   { bg: '#27AE60', color: '#fff' },
  'URGENTE': { bg: '#EB5757', color: '#fff' },
};

export default function Dashboard() {
  const [chartTab, setChartTab] = useState('Semana');
  const [search, setSearch]     = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const { selectedRegion } = useRegion();

  // Estado para dados reais
  const [kpiData, setKpiData]     = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);

  // Carrega KPIs do backend (filtrados pela equipe se GESTOR)
  useEffect(() => {
    setLoadingKpi(true);
    dashboardService.stats()
      .then(r => setKpiData(r.data?.data || r.data))
      .catch(() => setKpiData(null))
      .finally(() => setLoadingKpi(false));
  }, []);

  // Carrega lista de solicitações para a tabela
  useEffect(() => {
    setLoadingTable(true);
    ocorrenciaService.listar({ page: 0, size: 20 })
      .then(r => {
        const content = r.data?.data?.content || r.data?.content || [];
        setTableData(content);
      })
      .catch(() => setTableData([]))
      .finally(() => setLoadingTable(false));
  }, []);

  const kpis = useMemo(() => {
    if (!kpiData) return [];
    return [
      { label: 'TOTAL ABERTAS',    value: kpiData.totalAbertas    ?? 0, color: 'gray' },
      { label: 'EM ANDAMENTO',     value: kpiData.emAndamento     ?? 0, color: 'blue' },
      { label: 'CONCLUÍDAS',       value: kpiData.resolvidasHoje  ?? 0, color: 'green' },
      { label: 'PENDENTES',        value: kpiData.pendentesSla    ?? 0, color: 'orange' },
      { label: 'URGENTES',         value: kpiData.urgentes        ?? 0, color: 'red' },
    ];
  }, [kpiData]);

  const filteredTable = useMemo(() => {
    let data = tableData;
    if (search) {
      data = data.filter(r =>
        r.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        r.categoriaServico?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return data;
  }, [tableData, search]);

  // Dados derivados para o gráfico de barras (agrupado por dia da semana simulado)
  const barData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const grouped = { Dom: {a:0,r:0}, Seg:{a:0,r:0}, Ter:{a:0,r:0}, Qua:{a:0,r:0}, Qui:{a:0,r:0}, Sex:{a:0,r:0}, Sáb:{a:0,r:0} };
    tableData.forEach(s => {
      const d = s.dataCriacao ? new Date(s.dataCriacao) : null;
      if (d) {
        const day = days[d.getDay()];
        grouped[day].a += 1;
        if (s.status === 'CONCLUIDA') grouped[day].r += 1;
      }
    });
    return days.map(name => ({ name, abertas: grouped[name].a, resolvidas: grouped[name].r }));
  }, [tableData]);

  // Dados para gráfico de categorias
  const catData = useMemo(() => {
    const map = {};
    tableData.forEach(s => {
      const cat = s.categoriaServico || 'Outros';
      map[cat] = (map[cat] || 0) + 1;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#2F80ED', '#27AE60', '#9B51E0', '#F2994A', '#EB5757'];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        pct: Math.round(count / total * 100),
        color: colors[i % colors.length]
      }));
  }, [tableData]);

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Geral</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.stats}>
        {loadingKpi ? (
          <p style={{ color: 'var(--text-secondary)', padding: '12px' }}>Carregando indicadores...</p>
        ) : kpis.map((k, i) => (
          <div key={i} className={[styles.statCard, styles[k.color]].join(' ')}>
            <div className={styles.statLabel}>{k.label}</div>
            <div className={[styles.statValue, styles[k.color]].join(' ')}>{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.charts}>
        {/* Bar Chart — abertas x resolvidas por dia */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Ocorrências por dia</span>
            <div className={styles.chartTabBtns}>
              {['Semana', 'Mês'].map(t => (
                <button key={t} className={[styles.chartTabBtn, chartTab===t ? styles.active : ''].join(' ')} onClick={() => setChartTab(t)}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={10} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Bar dataKey="abertas" fill="#2F80ED" radius={[2,2,0,0]}/>
              <Bar dataKey="resolvidas" fill="#27AE60" radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'#2F80ED'}}/> Abertas</span>
            <span className={styles.legendItem}><span className={styles.legendDot} style={{background:'#27AE60'}}/> Resolvidas</span>
          </div>
        </div>

        {/* Category Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Por Categoria</span>
          </div>
          {catData.length === 0
            ? <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Carregando...</p>
            : catData.map((c, i) => (
              <div key={i} className={styles.catRow}>
                <span className={styles.catName}>{c.name}</span>
                <div className={styles.catBar}><div className={styles.catFill} style={{width: c.pct + '%', background: c.color}}/></div>
                <span className={styles.catPct}>{c.pct}%</span>
              </div>
            ))
          }
        </div>

        {/* Scatter — distribuição por status */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Distribuição de Status</span>
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <ScatterChart margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <ZAxis range={[60, 60]}/>
              <Tooltip/>
              <Scatter data={tableData.map((s, i) => ({
                x: (i * 13) % 100,
                y: (i * 17 + 20) % 100,
                color: STATUS_STYLE[s.status]?.bg || '#999'
              }))}>
                {tableData.map((s, i) => (
                  <Cell key={i} fill={STATUS_STYLE[s.status]?.bg || '#999'}/>
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {Object.entries(STATUS_STYLE).slice(0, 4).map(([k, v]) => (
              <span key={k} className={styles.legendItem}>
                <span className={styles.legendDot} style={{background: v.bg}}/> {v.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableHeaderLeft}>Solicitações Recentes</span>
          <div className={styles.tableActions}>
            <input className={styles.searchInput} placeholder="Buscar protocolo ou categoria..." value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          {loadingTable ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Carregando dados...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PROTOCOLO</th>
                  <th>CIDADÃO</th>
                  <th>STATUS</th>
                  <th>TIPO DE SERVIÇO</th>
                  <th>PRIORIDADE</th>
                  <th>DATA</th>
                  <th>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {filteredTable.map((row, i) => {
                  const st = STATUS_STYLE[row.status] || { label: row.status, bg: '#999', color: '#fff' };
                  const pr = PRIO_STYLE[row.prioridade];
                  const data = row.dataCriacao
                    ? new Date(row.dataCriacao).toLocaleDateString('pt-BR')
                    : '—';
                  return (
                    <tr key={row.id || i}>
                      <td className={styles.proto}>{row.protocolo}</td>
                      <td className={styles.muted}>{row.nomeUsuario || '—'}</td>
                      <td>
                        <span style={{
                          background: st.bg,
                          color: st.color,
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}>{st.label}</span>
                      </td>
                      <td>{row.categoriaServico}<br/><small style={{color:'var(--text-secondary)'}}>{row.subcategoriaServico}</small></td>
                      <td>
                        {pr ? (
                          <span style={{
                            background: pr.bg,
                            color: pr.color,
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>{row.prioridade}</span>
                        ) : <span style={{color:'var(--text-secondary)'}}>—</span>}
                      </td>
                      <td style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{data}</td>
                      <td><button className={styles.viewBtn} onClick={() => setSelectedProtocol(row)}>Ver</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Detalhes da Solicitação */}
      {selectedProtocol && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
        }}>
          <div style={{
            background: 'var(--surface)', padding: '24px', borderRadius: '8px',
            width: '440px', maxWidth: '90%', border: '1px solid var(--border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{marginTop: 0, marginBottom: '16px', fontSize: '1.2rem'}}>Detalhes da Solicitação</h2>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem'}}>
              <div><strong>Protocolo:</strong> {selectedProtocol.protocolo}</div>
              <div><strong>Status:</strong> {STATUS_STYLE[selectedProtocol.status]?.label || selectedProtocol.status}</div>
              <div><strong>Cidadão:</strong> {selectedProtocol.nomeUsuario || '—'}</div>
              <div><strong>Serviço:</strong> {selectedProtocol.categoriaServico} — {selectedProtocol.subcategoriaServico}</div>
              <div><strong>Equipe:</strong> {selectedProtocol.nomeEquipe || 'Não atribuída'}</div>
              <div><strong>Localização:</strong> {selectedProtocol.gps || '—'}</div>
              <div><strong>Prioridade:</strong> {selectedProtocol.prioridade || '—'}</div>
              <div><strong>Data:</strong> {selectedProtocol.dataCriacao ? new Date(selectedProtocol.dataCriacao).toLocaleString('pt-BR') : '—'}</div>
              <div><strong>Descrição:</strong> {selectedProtocol.descricao}</div>
              {selectedProtocol.historicos?.length > 0 && (
                <div>
                  <strong>Histórico:</strong>
                  <ul style={{marginTop: 6, paddingLeft: 16, fontSize: '0.82rem', color: 'var(--text-secondary)'}}>
                    {selectedProtocol.historicos.map((h, i) => (
                      <li key={i}><em>{new Date(h.data).toLocaleDateString('pt-BR')}</em> — {h.acao} ({h.nomeUsuario})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div style={{marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setSelectedProtocol(null)}
                style={{padding: '8px 16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer'}}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { dashboardService, ocorrenciaService } from '../../services/api';
import { useRegion } from '../../contexts/RegionContext';
import useEnderecos from '../../hooks/useEnderecos';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
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

function parseGps(gps) {
  if (!gps) return null;
  const raw = String(gps).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/\(|\)|\[|\]/g, '')
    .replace(/lat\s*[:=]/gi, ' latitude=')
    .replace(/lng\s*[:=]/gi, ' longitude=')
    .replace(/lon\s*[:=]/gi, ' longitude=')
    .replace(/;/g, ',')
    .replace(/,/g, ' ');

  const matches = Array.from(cleaned.matchAll(/[-+]?\d{1,3}(?:[.,]\d+)?/g), (match) => {
    const value = Number(match[0].replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }).filter((value) => value !== null);

  if (matches.length < 2) return null;

  const latitudeMatch = raw.match(/lat(?:itude)?\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);
  const longitudeMatch = raw.match(/(?:lng|lon|longitude)\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);

  const latitude = latitudeMatch
    ? Number(latitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim())
    : Number(matches[0]);
  const longitude = longitudeMatch
    ? Number(longitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim())
    : Number(matches[1]);

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
}

function resolveRegionFromGps(gps) {
  const coords = parseGps(gps);
  if (!coords) return 'Centro';

  const { latitude, longitude } = coords;
  if (latitude < -23.65 && longitude < -46.7) return 'Sul';
  if (latitude > -23.45 && longitude < -46.5) return 'Norte';
  if (longitude > -46.5) return 'Leste';
  if (longitude < -46.8) return 'Oeste';
  return 'Centro';
}

export default function Dashboard() {
  const [chartTab, setChartTab] = useState('Ano');
  const [search, setSearch]     = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedChartFilter, setSelectedChartFilter] = useState(null);
  const [periodScope, setPeriodScope] = useState(null);
  const { selectedRegion } = useRegion();

  // Estado para dados reais
  const [kpiData, setKpiData]     = useState(null);
  const [tableData, setTableData] = useState([]);
  const enderecos = useEnderecos(tableData);
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
    ocorrenciaService.listar({ page: 0, size: 200 })
      .then(r => {
        const content = r.data?.data?.content || r.data?.content || [];
        setTableData(content);
      })
      .catch(() => setTableData([]))
      .finally(() => setLoadingTable(false));
  }, []);

  const regionFilteredTable = useMemo(() => {
    if (!selectedRegion) return tableData;
    return tableData.filter((row) => resolveRegionFromGps(row.gps) === selectedRegion);
  }, [tableData, selectedRegion]);

  const filteredTable = useMemo(() => {
    let data = regionFilteredTable;
    if (search) {
      data = data.filter(r =>
        r.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        r.categoriaServico?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return data;
  }, [regionFilteredTable, search]);

  const kpisFromTable = useMemo(() => {
    const counts = regionFilteredTable.reduce((acc, row) => {
      const status = row.status || 'PENDENTE';
      if (status === 'PENDENTE') acc.abertas += 1;
      if (status === 'TRIAGEM') acc.abertas += 1;
      if (status === 'EM_ANDAMENTO' || status === 'EM_CAMPO') acc.andamento += 1;
      if (status === 'CONCLUIDA') acc.concluidas += 1;
      if (status === 'PENDENTE') acc.pendentes += 1;
      if (['ALTA', 'URGENTE'].includes((row.prioridade || '').toUpperCase())) acc.urgentes += 1;
      return acc;
    }, { abertas: 0, andamento: 0, concluidas: 0, pendentes: 0, urgentes: 0 });

    return [
      { label: 'TOTAL ABERTAS', value: counts.abertas, color: 'gray' },
      { label: 'EM ANDAMENTO', value: counts.andamento, color: 'blue' },
      { label: 'CONCLUÍDAS', value: counts.concluidas, color: 'green' },
      { label: 'PENDENTES', value: counts.pendentes, color: 'orange' },
      { label: 'URGENTES', value: counts.urgentes, color: 'red' },
    ];
  }, [regionFilteredTable]);

  const kpis = useMemo(() => {
    if (selectedRegion) return kpisFromTable;
    if (!kpiData) return [];
    return [
      { label: 'TOTAL ABERTAS', value: kpiData.totalAbertas ?? 0, color: 'gray' },
      { label: 'EM ANDAMENTO', value: kpiData.emAndamento ?? 0, color: 'blue' },
      { label: 'CONCLUÍDAS', value: kpiData.resolvidasHoje ?? 0, color: 'green' },
      { label: 'PENDENTES', value: kpiData.pendentesSla ?? 0, color: 'orange' },
      { label: 'URGENTES', value: kpiData.urgentes ?? 0, color: 'red' },
    ];
  }, [kpiData, selectedRegion, kpisFromTable]);

  const chartFilteredTable = useMemo(() => {
    return regionFilteredTable.filter((row) => {
      const date = row.dataCriacao ? new Date(row.dataCriacao) : null;
      if (periodScope && (!date || date < periodScope.start || date > periodScope.end)) return false;
      if (!selectedChartFilter) return true;
      if (selectedChartFilter.type === 'period') {
        return date && date >= selectedChartFilter.start && date <= selectedChartFilter.end;
      }
      if (selectedChartFilter.type === 'category') return row.categoriaServico === selectedChartFilter.value;
      return row.status === selectedChartFilter.value;
    });
  }, [regionFilteredTable, selectedChartFilter, periodScope]);

  const toggleChartFilter = (filter) => {
    setSelectedChartFilter((current) => (
      current?.type === filter.type && current?.value === filter.value ? null : filter
    ));
  };

  const selectPeriod = (period) => {
    if (chartTab === 'Ano') {
      setChartTab('Mês');
      setPeriodScope(period);
      setSelectedChartFilter(null);
    } else if (chartTab === 'Mês') {
      setChartTab('Semana');
      setPeriodScope(period);
      setSelectedChartFilter(null);
    } else {
      toggleChartFilter({ type: 'period', value: period.name, start: period.start, end: period.end });
    }
  };

  const resetPeriodScope = () => {
    setPeriodScope(null);
    setSelectedChartFilter(null);
  };

  // Agrupa somente as solicitações do período escolhido no gráfico.
  const barData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const periodInDays = chartTab === 'Semana' ? 7 : chartTab === 'Mês' ? 30 : 365;
    const start = periodScope ? new Date(periodScope.start) : new Date(today);
    if (!periodScope) start.setDate(start.getDate() - periodInDays + 1);
    start.setHours(0, 0, 0, 0);
    const rangeEnd = periodScope ? new Date(periodScope.end) : today;

    const periodRows = chartFilteredTable.filter((row) => {
      if (!row.dataCriacao) return false;
      const date = new Date(row.dataCriacao);
      return date >= start && date <= rangeEnd;
    });

    if (chartTab === 'Semana') {
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const dayRows = periodRows.filter((row) => new Date(row.dataCriacao).toDateString() === date.toDateString());
        return {
          name: date.toLocaleDateString('pt-BR', { day: '2-digit', weekday: 'short' }).replace('.', ''),
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999)),
          abertas: dayRows.length,
          resolvidas: dayRows.filter((row) => row.status === 'CONCLUIDA').length,
        };
      });
    }

    if (chartTab === 'Ano') {
      return Array.from({ length: 12 }, (_, index) => {
        const monthStart = new Date(today.getFullYear(), today.getMonth() - 11 + index, 1);
        const monthRows = periodRows.filter((row) => {
          const date = new Date(row.dataCriacao);
          return date.getFullYear() === monthStart.getFullYear() && date.getMonth() === monthStart.getMonth();
        });
        return {
          name: monthStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          start: monthStart,
          end: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999),
          abertas: monthRows.length,
          resolvidas: monthRows.filter((row) => row.status === 'CONCLUIDA').length,
        };
      });
    }

    return Array.from({ length: 5 }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + index * 7);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketStart.getDate() + (index === 4 ? 2 : 6));
      bucketEnd.setHours(23, 59, 59, 999);
      const bucketRows = periodRows.filter((row) => {
        const date = new Date(row.dataCriacao);
        return date >= bucketStart && date <= bucketEnd;
      });
      return {
        name: `Sem. ${index + 1}`,
        start: bucketStart,
        end: bucketEnd,
        abertas: bucketRows.length,
        resolvidas: bucketRows.filter((row) => row.status === 'CONCLUIDA').length,
      };
    });
  }, [chartTab, periodScope, chartFilteredTable]);

  // Dados para gráfico de categorias
  const catData = useMemo(() => {
    const map = {};
    chartFilteredTable.forEach(s => {
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
  }, [chartFilteredTable]);

  const statusData = useMemo(() => {
    const counts = chartFilteredTable.reduce((acc, row) => {
      const status = row.status || 'PENDENTE';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const total = chartFilteredTable.length || 1;
    return Object.entries(STATUS_STYLE)
      .map(([key, style]) => ({
        key,
        label: style.label,
        count: counts[key] || 0,
        pct: Math.round((counts[key] || 0) / total * 100),
        color: style.bg,
      }))
      .filter((status) => status.count > 0);
  }, [chartFilteredTable]);

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
            <span className={styles.chartTitle}>Ocorrências</span>
            {selectedChartFilter && (
              <button className={styles.clearChartFilter} onClick={() => setSelectedChartFilter(null)}>
                Limpar filtro
              </button>
            )}
            {periodScope && (
              <button className={styles.clearChartFilter} onClick={resetPeriodScope}>
                Voltar
              </button>
            )}
            <div className={styles.chartTabBtns}>
              {['Ano', 'Mês', 'Semana'].map(t => (
                <button key={t} className={[styles.chartTabBtn, chartTab===t ? styles.active : ''].join(' ')} onClick={() => { setChartTab(t); resetPeriodScope(); }}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={10} barGap={2}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Bar dataKey="abertas" fill="#2F80ED" radius={[2,2,0,0]} onClick={(_, index) => selectPeriod(barData[index])}/>
              <Bar dataKey="resolvidas" fill="#27AE60" radius={[2,2,0,0]} onClick={(_, index) => selectPeriod(barData[index])}/>
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
              <div key={i} className={[styles.catRow, selectedChartFilter?.type === 'category' && selectedChartFilter.value === c.name ? styles.chartSelected : ''].join(' ')} onClick={() => toggleChartFilter({ type: 'category', value: c.name })} role="button" tabIndex={0}>
                <span className={styles.catName}>{c.name}</span>
                <div className={styles.catBar}><div className={styles.catFill} style={{width: c.pct + '%', background: c.color}}/></div>
                <span className={styles.catPct}>{c.pct}%</span>
              </div>
            ))
          }
        </div>

        {/* Distribuição por status */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>Distribuição de Status</span>
          </div>
          <div className={styles.statusChart}>
            {statusData.length === 0 ? (
              <p className={styles.emptyChart}>Nenhuma solicitação encontrada</p>
            ) : statusData.map((status) => (
              <div key={status.key} className={[styles.statusRow, selectedChartFilter?.type === 'status' && selectedChartFilter.value === status.key ? styles.chartSelected : ''].join(' ')} onClick={() => toggleChartFilter({ type: 'status', value: status.key })} role="button" tabIndex={0}>
                <span className={styles.statusName}>{status.label}</span>
                <div className={styles.statusBar}>
                  <div
                    className={styles.statusFill}
                    style={{ width: `${Math.max(status.pct, 4)}%`, background: status.color }}
                  />
                </div>
                <span className={styles.statusCount}>{status.count}</span>
              </div>
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
              <div><strong>Localização:</strong> {selectedProtocol.endereco || enderecos[selectedProtocol.gps] || selectedProtocol.gps || '—'}</div>
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

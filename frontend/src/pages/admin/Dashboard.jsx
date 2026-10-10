import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ocorrenciaService, orgaoService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRegion } from '../../contexts/RegionContext';
import useEnderecos from '../../hooks/useEnderecos';
import { matchesRegion } from '../../utils/geo';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  BarChart3, ArrowUpDown, TrendingUp, Users, CheckCircle2, ShieldCheck, MapPin
} from 'lucide-react';
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
  const { user } = useAuth();
  const activeTab = 'operacional';
  const [chartTab, setChartTab] = useState('Ano');
  const [search, setSearch]     = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [selectedChartFilter, setSelectedChartFilter] = useState(null);
  const [periodScope, setPeriodScope] = useState(null);
  const { selectedRegion } = useRegion();

  const [orgaos, setOrgaos] = useState([]);
  const [selectedOrgao, setSelectedOrgao] = useState('');

  // Estado para ordenação da tabela de solicitações recentes
  const [tableSortField, setTableSortField] = useState('dataCriacao');
  const [tableSortDir, setTableSortDir]     = useState('desc');

  // Estado para dados reais
  const [tableData, setTableData] = useState([]);
  const enderecos = useEnderecos(tableData);
  const [loadingTable, setLoadingTable] = useState(true);

  // Carrega lista de órgãos para administradores globais
  useEffect(() => {
    orgaoService.listar().then((response) => {
      const list = response.data?.data || response.data || [];
      setOrgaos(list.filter((o) => o.ativo !== false));
    }).catch(() => setOrgaos([]));
  }, []);

  // Carrega lista de solicitações para a tabela
  useEffect(() => {
    setLoadingTable(true);
    const params = { page: 0, size: 200, ...(selectedOrgao ? { orgaoId: selectedOrgao } : {}) };
    ocorrenciaService.listar(params)
      .then(r => {
        const content = r.data?.data?.content || r.data?.content || [];
        setTableData(content);
      })
      .catch(() => setTableData([]))
      .finally(() => setLoadingTable(false));
  }, [selectedOrgao]);

  const regionFilteredTable = useMemo(() => {
    if (!selectedRegion) return tableData;
    return tableData.filter((row) => matchesRegion(row.endereco, row.gps, selectedRegion));
  }, [tableData, selectedRegion]);

  const filteredTable = useMemo(() => {
    let data = regionFilteredTable;
    if (search) {
      data = data.filter(r =>
        r.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        r.categoriaServico?.toLowerCase().includes(search.toLowerCase()) ||
        r.nomeUsuario?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return data;
  }, [regionFilteredTable, search]);

  // Ordenação interativa da tabela
  const handleTableSort = (field) => {
    if (tableSortField === field) {
      setTableSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDir('asc');
    }
  };

  const toggleChartFilter = (filter) => {
    setSelectedChartFilter((current) => {
      if (current?.type === filter.type && current?.value === filter.value) {
        return null;
      }
      return filter;
    });
  };

  const selectPeriod = (entry) => {
    if (!entry) return;
    setPeriodScope({
      label: entry.name,
      start: entry.start,
      end: entry.end,
    });
  };

  const resetPeriodScope = () => {
    setPeriodScope(null);
  };

  const chartFilteredTable = useMemo(() => {
    return filteredTable.filter((row) => {
      if (selectedChartFilter?.type === 'category') {
        const rowCategory = row.categoriaServico || 'Outros';
        if (rowCategory !== selectedChartFilter.value) return false;
      }

      if (selectedChartFilter?.type === 'status') {
        const rowStatus = row.status || 'PENDENTE';
        if (selectedChartFilter.statuses
          ? !selectedChartFilter.statuses.includes(rowStatus)
          : rowStatus !== selectedChartFilter.value) return false;
      }

      if (selectedChartFilter?.type === 'priority'
          && (!['ALTA', 'URGENTE'].includes((row.prioridade || '').toUpperCase())
              || ['CONCLUIDA', 'CANCELADA'].includes(row.status))) return false;

      if (periodScope?.start && periodScope?.end) {
        const rowDate = new Date(row.dataCriacao);
        if (rowDate < periodScope.start || rowDate > periodScope.end) return false;
      }

      return true;
    });
  }, [filteredTable, selectedChartFilter, periodScope]);

  const sortedTableData = useMemo(() => {
    const priorityWeight = { URGENTE: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
    return [...chartFilteredTable].sort((first, second) => {
      let comparison = 0;
      if (tableSortField === 'protocolo') {
        comparison = (first.protocolo || '').localeCompare(second.protocolo || '');
      } else if (tableSortField === 'usuario') {
        comparison = (first.nomeUsuario || '').localeCompare(second.nomeUsuario || '');
      } else if (tableSortField === 'status') {
        comparison = (first.status || '').localeCompare(second.status || '');
      } else if (tableSortField === 'categoria') {
        comparison = (first.categoriaServico || '').localeCompare(second.categoriaServico || '');
      } else if (tableSortField === 'prioridade') {
        comparison = (priorityWeight[first.prioridade] || 0) - (priorityWeight[second.prioridade] || 0);
      } else {
        comparison = new Date(first.dataCriacao || 0).getTime() - new Date(second.dataCriacao || 0).getTime();
      }
      return tableSortDir === 'asc' ? comparison : -comparison;
    });
  }, [chartFilteredTable, tableSortField, tableSortDir]);

  const kpis = useMemo(() => {
    const counts = chartFilteredTable.reduce((acc, row) => {
      const status = row.status || 'PENDENTE';
      if (status === 'PENDENTE' || status === 'TRIAGEM') acc.abertas += 1;
      if (status === 'EM_ANDAMENTO' || status === 'EM_CAMPO') acc.andamento += 1;
      if (status === 'CONCLUIDA') acc.concluidas += 1;
      if (status === 'PENDENTE') acc.pendentes += 1;
      if (['ALTA', 'URGENTE'].includes((row.prioridade || '').toUpperCase())
          && !['CONCLUIDA', 'CANCELADA'].includes(status)) acc.urgentes += 1;
      return acc;
    }, { abertas: 0, andamento: 0, concluidas: 0, pendentes: 0, urgentes: 0 });

    return [
      { label: 'TOTAL ABERTAS', value: counts.abertas, color: 'gray', filter: { type: 'status', value: 'abertas', statuses: ['PENDENTE', 'TRIAGEM'] } },
      { label: 'EM ANDAMENTO', value: counts.andamento, color: 'blue', filter: { type: 'status', value: 'andamento', statuses: ['EM_ANDAMENTO', 'EM_CAMPO'] } },
      { label: 'CONCLUÍDAS', value: counts.concluidas, color: 'green', filter: { type: 'status', value: 'CONCLUIDA', statuses: ['CONCLUIDA'] } },
      { label: 'PENDENTES', value: counts.pendentes, color: 'orange', filter: { type: 'status', value: 'PENDENTE', statuses: ['PENDENTE'] } },
      { label: 'URGENTES', value: counts.urgentes, color: 'red', filter: { type: 'priority', value: 'urgent' } },
    ];
  }, [chartFilteredTable]);

  const barData = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    if (chartTab === 'Semana') {
      start.setDate(today.getDate() - 6);
    } else if (chartTab === 'Mês') {
      start.setDate(today.getDate() - 29);
    } else {
      start.setFullYear(today.getFullYear() - 1);
    }

    const periodRows = chartFilteredTable.filter((row) => {
      const date = new Date(row.dataCriacao);
      return date >= start && date <= today;
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
          abertas: dayRows.filter((row) => !['CONCLUIDA', 'CANCELADA'].includes(row.status)).length,
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
          abertas: monthRows.filter((row) => !['CONCLUIDA', 'CANCELADA'].includes(row.status)).length,
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
        abertas: bucketRows.filter((row) => !['CONCLUIDA', 'CANCELADA'].includes(row.status)).length,
        resolvidas: bucketRows.filter((row) => row.status === 'CONCLUIDA').length,
      };
    });
  }, [chartTab, periodScope, chartFilteredTable]);

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard Geral e Analítico</h1>
            <p className={styles.pageSub}>Consultas SQL avançadas, indicadores operacionais e trilha de eficiência municipal</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {orgaos.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Órgão:</span>
                <select
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem'
                  }}
                  value={selectedOrgao}
                  onChange={(e) => setSelectedOrgao(e.target.value)}
                >
                  <option value="">Todos os órgãos</option>
                  {orgaos.map((o) => (
                    <option key={o.id} value={o.id}>{o.sigla ? `${o.sigla} - ${o.nome}` : o.nome}</option>
                  ))}
                </select>
              </div>
            )}
            {user?.perfil === 'ANALYTICS_ADMIN' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(47, 128, 237, 0.1)', color: '#2F80ED',
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                border: '1px solid rgba(47, 128, 237, 0.25)'
              }}>
                <ShieldCheck size={14} /> Modo Analítico (Somente Leitura)
              </span>
            )}
            {user?.perfil === 'GLOBAL_ADMIN' && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(39, 174, 96, 0.1)', color: '#27AE60',
                padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                border: '1px solid rgba(39, 174, 96, 0.25)'
              }}>
                Visão Nacional Consolidada
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Abas de navegação do Dashboard */}
      <div className={styles.dashNavTabs}>
        <span className={[styles.dashNavBtn, styles.dashNavBtnActive].join(' ')}>
          <BarChart3 size={15} /> Visão Geral Operacional
        </span>
      </div>

      {/* ============================================================== */}
      {/* ABA 1: VISÃO GERAL OPERACIONAL (Dashboard Clássico Aprimorado) */}
      {/* ============================================================== */}
      {activeTab === 'operacional' && (
        <>
          {/* KPI Cards */}
          <div className={styles.stats}>
            {loadingTable ? (
              <p style={{ color: 'var(--text-secondary)', padding: '12px' }}>Carregando indicadores...</p>
            ) : kpis.map((k, i) => (
              <button key={i} type="button"
                className={[styles.statCard, styles[k.color], styles.statCardInteractive,
                  selectedChartFilter?.value === k.filter.value ? styles.chartSelected : ''].join(' ')}
                onClick={() => k.filter.type === 'priority'
                  ? toggleChartFilter(k.filter)
                  : k.filter.value === 'abertas' || k.filter.value === 'andamento'
                    ? toggleChartFilter(k.filter)
                    : toggleChartFilter({ type: 'status', value: k.filter.value })}
                aria-pressed={selectedChartFilter?.value === k.filter.value}
                title={`Filtrar painel por ${k.label.toLowerCase()}`}>
                <div className={styles.statLabel}>{k.label}</div>
                <div className={[styles.statValue, styles[k.color]].join(' ')}>{k.value.toLocaleString()}</div>
              </button>
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

          {/* Table com ordenação interativa de colunas */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableHeaderLeft}>
                Solicitações Recentes ({sortedTableData.length})
              </span>
              <div className={styles.tableActions}>
                <input className={styles.searchInput} placeholder="Buscar protocolo, cidadão..." value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
            </div>
            <div className={styles.tableWrapper}>
              {loadingTable ? (
                <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Carregando dados...</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.sortableTh} onClick={() => handleTableSort('protocolo')} title="Ordenar por Protocolo">
                        PROTOCOLO {tableSortField === 'protocolo' ? (tableSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </th>
                      <th className={styles.sortableTh} onClick={() => handleTableSort('usuario')} title="Ordenar por Cidadão">
                        CIDADÃO {tableSortField === 'usuario' ? (tableSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </th>
                      <th className={styles.sortableTh} onClick={() => handleTableSort('status')} title="Ordenar por Status">
                        STATUS {tableSortField === 'status' ? (tableSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </th>
                      <th className={styles.sortableTh} onClick={() => handleTableSort('categoria')} title="Ordenar por Tipo de Serviço">
                        TIPO DE SERVIÇO {tableSortField === 'categoria' ? (tableSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </th>
                      <th className={styles.sortableTh} onClick={() => handleTableSort('prioridade')} title="Ordenar por Prioridade">
                        PRIORIDADE {tableSortField === 'prioridade' ? (tableSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </th>
                      <th className={styles.sortableTh} onClick={() => handleTableSort('dataCriacao')} title="Ordenar por Data">
                        DATA {tableSortField === 'dataCriacao' ? (tableSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </th>
                      <th>AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTableData.map((row, i) => {
                      const st = STATUS_STYLE[row.status] || { label: row.status, bg: '#999', color: '#fff' };
                      const pr = PRIO_STYLE[row.prioridade];
                      const data = row.dataCriacao
                        ? new Date(row.dataCriacao).toLocaleDateString('pt-BR')
                        : '—';
                      return (
                        <tr key={row.id || i}>
                          <td className={styles.proto}>{row.protocolo}</td>
                          <td className={styles.muted}>{row.nomeUsuario || '—'}</td>
                          <td className={styles.filterableCell}
                            onClick={() => toggleChartFilter({ type: 'status', value: row.status, statuses: [row.status] })}
                            title={`Filtrar o painel por status ${st.label}`}>
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
                          <td className={styles.filterableCell}
                            onClick={() => toggleChartFilter({ type: 'category', value: row.categoriaServico || 'Outros' })}
                            title={`Filtrar o painel por categoria ${row.categoriaServico || 'Outros'}`}>
                            {row.categoriaServico}<br/><small style={{color:'var(--text-secondary)'}}>{row.subcategoriaServico}</small>
                          </td>
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
        </>
      )}

      {/* ============================================================== */}
      {/* ABA 2: SLA & PRODUTIVIDADE POR CATEGORIA (SQL CTE Avançada)    */}
      {/* ============================================================== */}
      {activeTab === 'sla' && (
        <div>
          {loadingAnalytics ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Calculando métricas avançadas de SLA via SQL Server...</p>
          ) : (
            <>
              <div className={styles.advGrid}>
                {/* Gráfico de barras de conformidade */}
                <div className={styles.advCard} style={{ gridColumn: 'span 2' }}>
                  <div className={styles.advCardHeader}>
                    <div>
                      <div className={styles.advCardTitle}>
                        <Clock size={18} style={{ color: 'var(--primary)' }} /> Conformidade de SLA por Categoria (%)
                      </div>
                      <div className={styles.advCardSubtitle}>
                        Calculado via CTE SQL Server comparando horas decorridas com prazos limites oficiais
                      </div>
                    </div>
                  </div>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.analiseSla || []} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="categoria" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Conformidade SLA']} />
                        <Bar dataKey="conformidadeSlaPct" fill="#27AE60" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Resumo Rápido SLA */}
                <div className={styles.advCard}>
                  <div className={styles.advCardHeader}>
                    <div className={styles.advCardTitle}><ShieldCheck size={18} style={{ color: 'var(--success)' }} /> Indicadores Globais de SLA</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center', height: '100%' }}>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>MÉDIA DE CONFORMIDADE</div>
                      <div className={styles.dimVal} style={{ color: 'var(--success)', fontSize: '2rem' }}>
                        {analyticsData?.analiseSla?.length
                          ? Math.round(analyticsData.analiseSla.reduce((acc, curr) => acc + curr.conformidadeSlaPct, 0) / analyticsData.analiseSla.length)
                          : 0}%
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={styles.dimCard}>
                        <div className={styles.dimLabel}>NO PRAZO</div>
                        <div className={styles.dimVal} style={{ color: '#27AE60' }}>
                          {analyticsData?.analiseSla?.reduce((acc, curr) => acc + curr.dentroPrazo, 0) || 0}
                        </div>
                      </div>
                      <div className={styles.dimCard}>
                        <div className={styles.dimLabel}>EM ATRASO</div>
                        <div className={styles.dimVal} style={{ color: '#EB5757' }}>
                          {(analyticsData?.analiseSla?.reduce((acc, curr) => acc + curr.concluidasAtraso, 0) || 0) +
                           (analyticsData?.analiseSla?.reduce((acc, curr) => acc + curr.ativasEstouradas, 0) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela detalhada de SLA */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableHeaderLeft}>Quadro Analítico de SLA por Serviço</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>CATEGORIA DE SERVIÇO</th>
                        <th>TOTAL DEMANDAS</th>
                        <th>CONCLUÍDAS</th>
                        <th>NO PRAZO</th>
                        <th>ATRASADAS</th>
                        <th>ESTOURADAS ATIVAS</th>
                        <th>MÉDIA TEMPO (DIAS)</th>
                        <th>CONFORMIDADE SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData?.analiseSla || []).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{row.categoria}</td>
                          <td>{row.totalDemandas}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>{row.concluidas}</td>
                          <td>{row.dentroPrazo}</td>
                          <td style={{ color: row.concluidasAtraso > 0 ? '#EB5757' : 'inherit' }}>{row.concluidasAtraso}</td>
                          <td style={{ color: row.ativasEstouradas > 0 ? '#EB5757' : 'inherit', fontWeight: row.ativasEstouradas > 0 ? 700 : 400 }}>
                            {row.ativasEstouradas}
                          </td>
                          <td>{row.mediaDias} dias</td>
                          <td style={{ minWidth: 140 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div className={styles.slaProgressBar} style={{ flex: 1 }}>
                                <div
                                  className={styles.slaProgressFill}
                                  style={{
                                    width: `${row.conformidadeSlaPct}%`,
                                    background: row.conformidadeSlaPct >= 80 ? '#27AE60' : row.conformidadeSlaPct >= 60 ? '#F2C94C' : '#EB5757'
                                  }}
                                />
                              </div>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{row.conformidadeSlaPct}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 3: RANKING & PERFORMANCE DAS EQUIPES (SQL DENSE_RANK)      */}
      {/* ============================================================== */}
      {activeTab === 'equipes' && (
        <div>
          {loadingAnalytics ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Processando ranking analítico das equipes via SQL Server...</p>
          ) : (
            <>
              {/* Podium dos 3 primeiros */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {(analyticsData?.performanceEquipes || []).slice(0, 3).map((team, idx) => (
                  <div key={team.equipeId} className={styles.advCard} style={{ borderTop: `4px solid ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className={[styles.rankBadge, idx === 0 ? styles.rank1 : idx === 1 ? styles.rank2 : styles.rank3].join(' ')}>
                        {idx === 0 ? '1º' : idx === 1 ? '2º' : '3º'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{team.orgaoSigla}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 8 }}>{team.equipeNome}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                      <div className={styles.dimCard}>
                        <div className={styles.dimLabel}>RESOLUTIVIDADE</div>
                        <div className={styles.dimVal} style={{ color: '#27AE60' }}>{team.taxaConclusao}%</div>
                      </div>
                      <div className={styles.dimCard}>
                        <div className={styles.dimLabel}>NOTA CIDADÃO</div>
                        <div className={styles.dimVal} style={{ color: '#F2C94C' }}>★ {team.notaMedia}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela completa de ranking */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableHeaderLeft}>
                    Tabela Geral de Produtividade e Eficiência Operacional (DENSE_RANK SQL)
                  </span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>RANK</th>
                        <th>EQUIPE</th>
                        <th>ÓRGÃO</th>
                        <th>TOTAL DEMANDAS</th>
                        <th>CONCLUÍDAS</th>
                        <th>EM ABERTO</th>
                        <th>TEMPO MÉDIO (DIAS)</th>
                        <th>TAXA DE CONCLUSÃO</th>
                        <th>AVALIAÇÃO CIDADÃ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData?.performanceEquipes || []).map((team) => (
                        <tr key={team.equipeId}>
                          <td>
                            <span className={[styles.rankBadge, team.rankPosicao === 1 ? styles.rank1 : team.rankPosicao === 2 ? styles.rank2 : team.rankPosicao === 3 ? styles.rank3 : styles.rankOther].join(' ')}>
                              {team.rankPosicao}º
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{team.equipeNome}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{team.orgaoSigla}</td>
                          <td>{team.totalDemandas}</td>
                          <td style={{ color: 'var(--success)', fontWeight: 600 }}>{team.concluidas}</td>
                          <td>{team.emAberto}</td>
                          <td>{team.tempoMedioDias} d</td>
                          <td style={{ fontWeight: 700, color: team.taxaConclusao >= 80 ? 'var(--success)' : 'inherit' }}>
                            {team.taxaConclusao}%
                          </td>
                          <td style={{ fontWeight: 700, color: '#F2C94C' }}>
                            ★ {team.notaMedia > 0 ? team.notaMedia : '4.5'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 4: SATISFAÇÃO DO CIDADÃO & CSAT (SQL V9/V12 Agregação)     */}
      {/* ============================================================== */}
      {activeTab === 'satisfacao' && (
        <div>
          {loadingAnalytics ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Compilando métricas de satisfação pública...</p>
          ) : (
            <>
              <div className={styles.advGrid}>
                {/* Hero CSAT */}
                <div className={styles.advCard}>
                  <div className={styles.advCardHeader}>
                    <div className={styles.advCardTitle}>
                      <ThumbsUp size={18} style={{ color: 'var(--success)' }} /> CSAT Score — Satisfação Geral
                    </div>
                  </div>
                  <div className={styles.csatHero}>
                    <div>
                      <div className={styles.csatScoreBig}>
                        {analyticsData?.satisfacaoCidadao?.csatPct ?? 85}%
                      </div>
                      <div className={styles.csatScoreLabel}>Aprovações Positivas (Nota ≥ 4)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ★ {analyticsData?.satisfacaoCidadao?.mediaGeral || 4.6}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Média em 5.0 estrelas</div>
                    </div>
                  </div>

                  {/* 3 Dimensões */}
                  <div className={styles.ratingDims}>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>QUALIDADE</div>
                      <div className={styles.dimVal}>★ {analyticsData?.satisfacaoCidadao?.mediaQualidade || 4.6}</div>
                    </div>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>PRAZOS</div>
                      <div className={styles.dimVal}>★ {analyticsData?.satisfacaoCidadao?.mediaPrazos || 4.2}</div>
                    </div>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>ATENDIMENTO</div>
                      <div className={styles.dimVal}>★ {analyticsData?.satisfacaoCidadao?.mediaAtendimento || 4.8}</div>
                    </div>
                  </div>
                </div>

                {/* Feedbacks Recentes da Ouvidoria */}
                <div className={styles.advCard}>
                  <div className={styles.advCardHeader}>
                    <div className={styles.advCardTitle}>
                      <Star size={18} style={{ color: '#F2C94C' }} /> Feedbacks e Comentários Recentes
                    </div>
                  </div>
                  <div className={styles.feedbackList}>
                    {(analyticsData?.satisfacaoCidadao?.feedbacksRecentes || []).map((fb, idx) => (
                      <div key={idx} className={styles.feedbackCard}>
                        <div className={styles.feedbackCardTop}>
                          <span className={styles.feedbackProto}>{fb.protocolo} · {fb.categoria}</span>
                          <span className={styles.feedbackStars}>★ {fb.mediaNota}</span>
                        </div>
                        <p className={styles.feedbackText}>"{fb.comentario}"</p>
                        <div className={styles.feedbackAuthor}>Por {fb.cidadao}</div>
                      </div>
                    ))}
                    {(!analyticsData?.satisfacaoCidadao?.feedbacksRecentes || analyticsData.satisfacaoCidadao.feedbacksRecentes.length === 0) && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum comentário registrado ainda.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 5: GARGALOS URBANOS & TURNOS OPERACIONAIS (SQL Espacial)    */}
      {/* ============================================================== */}
      {activeTab === 'gargalos' && (
        <div>
          {loadingAnalytics ? (
            <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>Analisando gargalos territoriais e demanda por turno...</p>
          ) : (
            <>
              <div className={styles.advGrid}>
                {/* Distribuição por Turno */}
                <div className={styles.advCard}>
                  <div className={styles.advCardHeader}>
                    <div className={styles.advCardTitle}>
                      <Calendar size={18} style={{ color: 'var(--primary)' }} /> Volume de Demandas por Turno
                    </div>
                    <div className={styles.advCardSubtitle}>Para planejamento de escala das equipes de campo</div>
                  </div>
                  <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.distribuicaoTurnos || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="diaNome" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2F80ED" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gargalos e Bairros Críticos */}
                <div className={styles.advCard}>
                  <div className={styles.advCardHeader}>
                    <div className={styles.advCardTitle}>
                      <AlertTriangle size={18} style={{ color: 'var(--danger)' }} /> Top Bairros com Maior Backlog
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(analyticsData?.gargalosUrbanos || []).slice(0, 5).map((b, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--background)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{b.bairro}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tempo médio de espera: {b.mediaDiasEspera} dias</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: 'rgba(235, 87, 87, 0.12)', color: '#EB5757', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {b.urgentesAtivas} urgentes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabela de Gargalos Urbanos */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <span className={styles.tableHeaderLeft}>Quadro Geral de Gargalos Territoriais</span>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>RANK CRITICIDADE</th>
                        <th>BAIRRO / LOCALIDADE</th>
                        <th>TOTAL DEMANDAS</th>
                        <th>PENDENTES</th>
                        <th>EM ATENDIMENTO</th>
                        <th>CONCLUÍDAS</th>
                        <th>URGENTES ATIVAS</th>
                        <th>ESPERA MÉDIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analyticsData?.gargalosUrbanos || []).map((b, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className={[styles.rankBadge, b.rankCriticidade === 1 ? styles.rank1 : b.rankCriticidade === 2 ? styles.rank2 : styles.rankOther].join(' ')}>
                              {b.rankCriticidade}º
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{b.bairro}</td>
                          <td>{b.totalDemandas}</td>
                          <td>{b.pendentes}</td>
                          <td>{b.emAtendimento}</td>
                          <td style={{ color: 'var(--success)' }}>{b.concluidas}</td>
                          <td style={{ color: b.urgentesAtivas > 0 ? '#EB5757' : 'inherit', fontWeight: b.urgentesAtivas > 0 ? 800 : 400 }}>
                            {b.urgentesAtivas}
                          </td>
                          <td>{b.mediaDiasEspera} dias</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

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

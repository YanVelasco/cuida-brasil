import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { relatorioService, equipeService } from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, FileText, Download } from 'lucide-react';
import styles from './Relatorios.module.css';

const PERIODS = ['Esta semana', 'Este mês', 'Último trimestre', 'Anual'];
const CAT_COLORS = ['#2F80ED', '#27AE60', '#9B51E0', '#F2994A', '#EB5757'];

export default function Relatorios() {
  const [period, setPeriod] = useState('Este mês');
  const [catData, setCatData]   = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [kpiData, setKpiData]   = useState(null);
  const [gestor, setGestor] = useState('');
  const [gestores, setGestores] = useState([]);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading]   = useState(true);
  const [statusData, setStatusData] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [matrizIA, setMatrizIA] = useState([]);
  const [territorial, setTerritorial] = useState([]);
  const [showReport, setShowReport] = useState(false);

  const getPeriod = () => {
    if (customStart && customEnd) return { inicio: customStart, fim: customEnd };
    const end = new Date();
    const start = new Date(end);
    if (period === 'Esta semana') start.setDate(end.getDate() - 6);
    if (period === 'Este mês') start.setDate(1);
    if (period === 'Último trimestre') start.setMonth(end.getMonth() - 2, 1);
    if (period === 'Anual') start.setMonth(0, 1);
    const format = (date) => date.toISOString().slice(0, 10);
    return { inicio: format(start), fim: format(end) };
  };

  useEffect(() => {
    setLoading(true);

    const params = { ...getPeriod(), ...(gestor ? { gestor } : {}) };
    Promise.allSettled([
      relatorioService.porCategoria(params),
      relatorioService.tendenciaMensal(params),
      relatorioService.resumo(params),
      relatorioService.porStatus(params),
      relatorioService.indicadores(),
      relatorioService.matrizIA(),
      relatorioService.territorial(),
    ]).then(([catRes, tendRes, kpiRes, statusRes, indRes, matrizRes, terrRes]) => {
      if (catRes.status === 'fulfilled') {
        const raw = catRes.value?.data?.data || catRes.value?.data || [];
        setCatData(raw.map((item, i) => ({ ...item, color: CAT_COLORS[i % CAT_COLORS.length] })));
      }
      if (tendRes.status === 'fulfilled') {
        const raw = tendRes.value?.data?.data || tendRes.value?.data || [];
        setTendencia(raw);
      }
      if (kpiRes.status === 'fulfilled') {
        setKpiData(kpiRes.value?.data?.data || kpiRes.value?.data);
      }
      if (statusRes.status === 'fulfilled') {
        setStatusData(statusRes.value?.data?.data || statusRes.value?.data || []);
      }
      if (indRes.status === 'fulfilled') {
        setIndicadores(indRes.value?.data?.data || indRes.value?.data);
      }
      if (matrizRes.status === 'fulfilled') {
        setMatrizIA(matrizRes.value?.data?.data || matrizRes.value?.data || []);
      }
      if (terrRes.status === 'fulfilled') {
        setTerritorial(terrRes.value?.data?.data || terrRes.value?.data || []);
      }
    }).finally(() => setLoading(false));
  }, [period, gestor, customStart, customEnd]);

  useEffect(() => {
    equipeService.dashboard({ page: 0, size: 200 }).then((response) => {
      const data = response.data?.data || response.data || {};
      const items = Array.isArray(data) ? data : (data.content || []);
      setGestores([...new Set(items.map((item) => item.supervisor).filter((nome) => nome && nome !== 'Sem supervisor'))].sort());
    }).catch(() => setGestores([]));
  }, []);

  const totalSolicitacoes = kpiData?.total ?? catData.reduce((sum, c) => sum + (c.qtd || 0), 0);
  const periodLabel = customStart && customEnd ? `${customStart} a ${customEnd}` : period;
  const geradoEm = new Date().toLocaleString('pt-BR');

  const exportPDF = () => {
    const doc = new jsPDF();
    const azul = [19, 81, 180];

    doc.setFillColor(...azul);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Cuidar+Brasil — Relatório Executivo', 14, 12);
    doc.setFontSize(9);
    doc.text(`Período: ${periodLabel}${gestor ? ` | Gestor: ${gestor}` : ''} | Gerado em: ${geradoEm}`, 14, 20);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(12);
    doc.text('Resumo Geral', 14, 38);
    autoTable(doc, {
      startY: 42,
      head: [['Total', 'Concluídas', 'Em Andamento', 'Abertas', 'Urgentes']],
      body: [[totalSolicitacoes, kpiData?.concluidas ?? 0, kpiData?.emAndamento ?? 0, kpiData?.abertas ?? 0, kpiData?.urgentes ?? 0]],
      headStyles: { fillColor: azul },
    });

    if (indicadores) {
      doc.text('Indicadores Nacionais', 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Indicador', 'Valor']],
        body: [
          ['Taxa de conclusão', `${indicadores.taxaConclusao ?? 0}%`],
          ['Tempo médio de resolução', indicadores.tempoMedioResolucaoDias != null ? `${indicadores.tempoMedioResolucaoDias} dias` : 'N/D'],
          ['Urgentes em aberto', indicadores.urgentesAbertas ?? 0],
          ['Cidadãos cadastrados', indicadores.cidadaosCadastrados ?? 0],
          ['Gestores ativos', indicadores.gestoresAtivos ?? 0],
          ['Equipes operacionais', indicadores.equipesOperacionais ?? 0],
          ['Órgãos integrados', indicadores.orgaosIntegrados ?? 0],
          ['Regiões atendidas', indicadores.regioesAtendidas ?? 0],
        ],
        headStyles: { fillColor: azul },
      });
    }

    doc.text('Solicitações por Categoria', 14, doc.lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [['Categoria', 'Quantidade', '%']],
      body: catData.map(c => [c.nome, c.qtd, `${c.pct}%`]),
      headStyles: { fillColor: azul },
    });

    if (statusData.length > 0) {
      doc.text('Solicitações por Status', 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Status', 'Total']],
        body: statusData.map(s => [s.status, s.total]),
        headStyles: { fillColor: azul },
      });
    }

    if (territorial.length > 0) {
      doc.text('Inteligência Territorial (por região)', 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Região', 'Total', 'Abertas', 'Concluídas', 'Urgentes', 'Criticidade']],
        body: territorial.slice(0, 15).map(t => [t.regiao, t.total, t.abertas, t.concluidas, t.urgentes, `${t.criticidade}%`]),
        headStyles: { fillColor: azul },
      });
    }

    if (matrizIA.length > 0) {
      doc.text('Matriz Serviço x Prioridade x Equipe (IA)', 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Serviço', 'Prioridade', 'Equipe', 'Atendimentos']],
        body: matrizIA.map(m => [m.servico, m.prioridade, m.equipe, m.atendimentos]),
        headStyles: { fillColor: azul },
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(`Cuidar+Brasil GovTech — Zeladoria Urbana Inteligente | Página ${i} de ${pageCount}`, 14, 290);
    }

    doc.save(`relatorio-cuidar-brasil-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Relatórios</h1>
      </div>

      {/* Period filter */}
      <div className={styles.periodBar}>
        <div className={styles.periodTabs}>
          {PERIODS.map(p => (
            <button key={p} className={[styles.periodTab, period === p ? styles.periodActive : ''].join(' ')} onClick={() => { setPeriod(p); setCustomStart(''); setCustomEnd(''); }}>{p}</button>
          ))}
        </div>
        <div className={styles.customRange}>
          <input type="date" className={styles.dateInput} value={customStart} onChange={(event) => setCustomStart(event.target.value)}/>
          <span>→</span>
          <input type="date" className={styles.dateInput} value={customEnd} onChange={(event) => setCustomEnd(event.target.value)}/>
        </div>
        <select className={styles.dateInput} value={gestor} onChange={(event) => setGestor(event.target.value)}>
          <option value="">Todos os gestores</option>
          {gestores.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
        </select>
        <button className={styles.exportBtn} onClick={() => setShowReport(true)} disabled={loading}>
          <FileText size={16} style={{verticalAlign: 'middle', marginRight: 6}}/>Visualizar Relatório
        </button>
      </div>

      {/* KPI Cards — dados reais */}
      <div className={styles.kpis}>
        {[
          {
            label: 'TOTAL DE CHAMADOS',
            value: loading ? '...' : totalSolicitacoes.toLocaleString('pt-BR'),
            sub: 'dados do banco',
            color: 'gray'
          },
          {
            label: 'CONCLUÍDAS',
            value: loading ? '...' : (kpiData?.concluidas ?? 0),
            sub: 'total concluídas',
            color: 'green'
          },
          {
            label: 'URGENTES ABERTAS',
            value: loading ? '...' : (kpiData?.urgentes ?? 0),
            sub: 'requerem ação',
            color: 'orange'
          },
          {
            label: 'EM ANDAMENTO',
            value: loading ? '...' : (kpiData?.emAndamento ?? 0),
            sub: 'total em andamento',
            color: 'yellow'
          },
        ].map((k, i) => (
          <div key={i} className={[styles.kpiCard, styles[k.color]].join(' ')}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiVal}>{k.value}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartGrid}>
        {/* Tendência Mensal */}
        <div className={styles.chartCard}>
          <h3>Tendência Mensal</h3>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Carregando...</p>
          ) : tendencia.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Não há dados de tendência mensal ainda.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tendencia} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="mes" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip/>
                <Area type="monotone" dataKey="total" stroke="#2F80ED" fill="rgba(47,128,237,0.08)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
          {tendencia.length > 0 && (
            <div className={styles.legend}>
              <span className={styles.legendItem}><span className={styles.ldot} style={{background:'#2F80ED'}}/> Total de solicitações</span>
            </div>
          )}
        </div>

        {/* Por Categoria table */}
        <div className={styles.catCard}>
          <h3>Por Categoria</h3>
          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Carregando...</p>
          ) : catData.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nenhum dado de categoria.</p>
          ) : (
            <table className={styles.catTable}>
              <thead>
                <tr>
                  <th>CATEGORIA</th>
                  <th>QTD</th>
                  <th style={{width: 120}}></th>
                </tr>
              </thead>
              <tbody>
                {catData.map((c, i) => (
                  <tr key={i}>
                    <td>{c.nome}</td>
                    <td style={{fontWeight: 700}}>{c.qtd}</td>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:6}}>
                        <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                          <div style={{width: c.pct + '%', height:'100%', background:c.color, borderRadius:4}}/>
                        </div>
                        <span style={{fontSize:'0.78rem',fontWeight:700,color:c.color,width:30}}>{c.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Resumo de Status */}
      <div className={styles.slaCard}>
        <div className={styles.slaHeader}>
          <h3>Resumo por Status</h3>
          <span className={styles.slaSub}>dados em tempo real</span>
        </div>
        <div className={styles.slaGrid}>
          {[
            { nome: 'Abertas (Pendente + Triagem)', pct: kpiData ? Math.min(100, Math.round(kpiData.abertas / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#F2994A' },
            { nome: 'Em Andamento + Campo',          pct: kpiData ? Math.min(100, Math.round(kpiData.emAndamento / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#2F80ED' },
            { nome: 'Concluídas',                    pct: kpiData ? Math.min(100, Math.round(kpiData.concluidas / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#27AE60' },
            { nome: 'Urgentes em Aberto',             pct: kpiData ? Math.min(100, Math.round(kpiData.urgentes / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#EB5757' },
          ].map((s, i) => (
            <div key={i} className={styles.slaRow}>
              <span className={styles.slaName}>{s.nome}</span>
              <div className={styles.slaBar}>
                <div className={styles.slaFill} style={{width: s.pct + '%', background: s.color}}/>
              </div>
              <span className={styles.slaPct} style={{color: s.color}}>{loading ? '...' : s.pct + '%'}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Matriz Serviço x Prioridade x Equipe (IA) */}
      <div className={styles.slaCard} style={{marginTop: 16}}>
        <div className={styles.slaHeader}>
          <h3>Matriz Serviço × Prioridade × Equipe (IA)</h3>
          <span className={styles.slaSub}>base de conhecimento usada pela IA para roteamento de equipes</span>
        </div>
        {matrizIA.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sem dados suficientes ainda.</p>
        ) : (
          <table className={styles.catTable}>
            <thead>
              <tr><th>SERVIÇO</th><th>PRIORIDADE</th><th>EQUIPE</th><th>ATENDIMENTOS</th></tr>
            </thead>
            <tbody>
              {matrizIA.map((m, i) => (
                <tr key={i}>
                  <td>{m.servico}</td>
                  <td>{m.prioridade}</td>
                  <td>{m.equipe}</td>
                  <td style={{fontWeight: 700}}>{m.atendimentos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Inteligência Territorial */}
      <div className={styles.slaCard} style={{marginTop: 16}}>
        <div className={styles.slaHeader}>
          <h3>Inteligência Territorial</h3>
          <span className={styles.slaSub}>solicitações agregadas por região</span>
        </div>
        {territorial.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sem dados territoriais ainda.</p>
        ) : (
          <table className={styles.catTable}>
            <thead>
              <tr><th>REGIÃO</th><th>TOTAL</th><th>ABERTAS</th><th>CONCLUÍDAS</th><th>URGENTES</th><th>CRITICIDADE</th></tr>
            </thead>
            <tbody>
              {territorial.slice(0, 10).map((t, i) => (
                <tr key={i}>
                  <td>{t.regiao}</td>
                  <td style={{fontWeight: 700}}>{t.total}</td>
                  <td>{t.abertas}</td>
                  <td>{t.concluidas}</td>
                  <td style={{color: t.urgentes > 0 ? '#EB5757' : 'inherit', fontWeight: t.urgentes > 0 ? 700 : 400}}>{t.urgentes}</td>
                  <td style={{fontWeight: 700, color: t.criticidade >= 30 ? '#EB5757' : t.criticidade >= 10 ? '#F2994A' : '#27AE60'}}>{t.criticidade}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Relatório em tela antes da exportação */}
      {showReport && (
        <div className={styles.reportOverlay} onClick={() => setShowReport(false)}>
          <div className={styles.reportModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reportHeader}>
              <div>
                <h2>Relatório Executivo — Cuidar+Brasil</h2>
                <p>Período: {periodLabel}{gestor ? ` | Gestor: ${gestor}` : ''} | Gerado em: {geradoEm}</p>
              </div>
              <div className={styles.reportActions}>
                <button className={styles.exportBtn} onClick={exportPDF}>
                  <Download size={16} style={{verticalAlign: 'middle', marginRight: 6}}/>Exportar PDF
                </button>
                <button className={styles.closeBtn} onClick={() => setShowReport(false)} aria-label="Fechar"><X size={20}/></button>
              </div>
            </div>

            <div className={styles.reportBody}>
              <h3>1. Resumo Geral</h3>
              <table className={styles.catTable}>
                <thead><tr><th>TOTAL</th><th>CONCLUÍDAS</th><th>EM ANDAMENTO</th><th>ABERTAS</th><th>URGENTES</th></tr></thead>
                <tbody><tr>
                  <td style={{fontWeight:700}}>{totalSolicitacoes}</td>
                  <td>{kpiData?.concluidas ?? 0}</td>
                  <td>{kpiData?.emAndamento ?? 0}</td>
                  <td>{kpiData?.abertas ?? 0}</td>
                  <td>{kpiData?.urgentes ?? 0}</td>
                </tr></tbody>
              </table>

              {indicadores && (
                <>
                  <h3>2. Indicadores Nacionais</h3>
                  <table className={styles.catTable}>
                    <tbody>
                      <tr><td>Taxa de conclusão</td><td style={{fontWeight:700}}>{indicadores.taxaConclusao ?? 0}%</td></tr>
                      <tr><td>Tempo médio de resolução</td><td style={{fontWeight:700}}>{indicadores.tempoMedioResolucaoDias != null ? `${indicadores.tempoMedioResolucaoDias} dias` : 'N/D'}</td></tr>
                      <tr><td>Urgentes em aberto</td><td style={{fontWeight:700}}>{indicadores.urgentesAbertas ?? 0}</td></tr>
                      <tr><td>Cidadãos cadastrados</td><td style={{fontWeight:700}}>{indicadores.cidadaosCadastrados ?? 0}</td></tr>
                      <tr><td>Gestores ativos</td><td style={{fontWeight:700}}>{indicadores.gestoresAtivos ?? 0}</td></tr>
                      <tr><td>Equipes operacionais</td><td style={{fontWeight:700}}>{indicadores.equipesOperacionais ?? 0}</td></tr>
                      <tr><td>Órgãos integrados</td><td style={{fontWeight:700}}>{indicadores.orgaosIntegrados ?? 0}</td></tr>
                      <tr><td>Regiões atendidas</td><td style={{fontWeight:700}}>{indicadores.regioesAtendidas ?? 0}</td></tr>
                    </tbody>
                  </table>
                </>
              )}

              <h3>3. Solicitações por Categoria</h3>
              <table className={styles.catTable}>
                <thead><tr><th>CATEGORIA</th><th>QTD</th><th>%</th></tr></thead>
                <tbody>
                  {catData.map((c, i) => (
                    <tr key={i}><td>{c.nome}</td><td style={{fontWeight:700}}>{c.qtd}</td><td>{c.pct}%</td></tr>
                  ))}
                </tbody>
              </table>

              {statusData.length > 0 && (
                <>
                  <h3>4. Solicitações por Status</h3>
                  <table className={styles.catTable}>
                    <thead><tr><th>STATUS</th><th>TOTAL</th></tr></thead>
                    <tbody>
                      {statusData.map((s, i) => (
                        <tr key={i}><td>{s.status}</td><td style={{fontWeight:700}}>{s.total}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {territorial.length > 0 && (
                <>
                  <h3>5. Inteligência Territorial</h3>
                  <table className={styles.catTable}>
                    <thead><tr><th>REGIÃO</th><th>TOTAL</th><th>ABERTAS</th><th>CONCLUÍDAS</th><th>URGENTES</th></tr></thead>
                    <tbody>
                      {territorial.slice(0, 15).map((t, i) => (
                        <tr key={i}><td>{t.regiao}</td><td style={{fontWeight:700}}>{t.total}</td><td>{t.abertas}</td><td>{t.concluidas}</td><td>{t.urgentes}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {matrizIA.length > 0 && (
                <>
                  <h3>6. Matriz Serviço × Prioridade × Equipe (IA)</h3>
                  <table className={styles.catTable}>
                    <thead><tr><th>SERVIÇO</th><th>PRIORIDADE</th><th>EQUIPE</th><th>ATENDIMENTOS</th></tr></thead>
                    <tbody>
                      {matrizIA.map((m, i) => (
                        <tr key={i}><td>{m.servico}</td><td>{m.prioridade}</td><td>{m.equipe}</td><td style={{fontWeight:700}}>{m.atendimentos}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              <p className={styles.reportFooter}>Cuidar+Brasil GovTech — Zeladoria Urbana Inteligente para Cidades Brasileiras</p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { relatorioService, gestorService, analyticsService, orgaoService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRegion } from '../../contexts/RegionContext';
import { matchesRegion, resolveRegionFromLocation } from '../../utils/geo';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  X, FileText, Download, BarChart3, Clock, Award, Star, AlertTriangle, ShieldCheck, ThumbsUp, Calendar
} from 'lucide-react';
import styles from './Relatorios.module.css';

const PERIODS = ['Esta semana', 'Este mês', 'Último trimestre', 'Anual'];
const CAT_COLORS = ['#2F80ED', '#27AE60', '#9B51E0', '#F2994A', '#EB5757'];

export default function Relatorios() {
  const { user } = useAuth();
  const { selectedRegion } = useRegion();
  const [activeTab, setActiveTab] = useState('geral'); // 'geral', 'sla', 'equipes', 'satisfacao', 'gargalos'
  const [period, setPeriod] = useState('Este mês');
  const [reportRows, setReportRows] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [gestor, setGestor] = useState('');
  const [gestores, setGestores] = useState([]);
  const [orgaos, setOrgaos] = useState([]);
  const [orgaoSelecionado, setOrgaoSelecionado] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading]   = useState(true);
  const [indicadores, setIndicadores] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Dados das consultas analíticas SQL avançadas (SLA, Ranking, CSAT, Gargalos)
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsFilter, setAnalyticsFilter] = useState(null);

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPeriod = () => {
    if (customStart || customEnd) {
      const start = customStart || customEnd;
      const end = customEnd || customStart;
      return start <= end ? { inicio: start, fim: end } : { inicio: end, fim: start };
    }
    const end = new Date();
    const start = new Date(end);
    const selectedPeriod = PERIODS.includes(period) ? period : 'Este mês';
    if (selectedPeriod === 'Esta semana') {
      const daysSinceMonday = (end.getDay() + 6) % 7;
      start.setDate(end.getDate() - daysSinceMonday);
    }
    if (selectedPeriod === 'Este mês') start.setDate(1);
    if (selectedPeriod === 'Último trimestre') start.setMonth(end.getMonth() - 2, 1);
    if (selectedPeriod === 'Anual') start.setMonth(0, 1);
    return { inicio: formatDate(start), fim: formatDate(end) };
  };

  useEffect(() => {
    setLoading(true);

    const params = {
      ...getPeriod(),
      ...(gestor ? { gestor } : {}),
      ...(orgaoSelecionado ? { orgaoId: orgaoSelecionado } : {})
    };
    Promise.allSettled([
      relatorioService.visaoGeral(params),
      relatorioService.indicadores(params),
    ]).then(([rowsRes, indRes]) => {
      if (rowsRes.status === 'fulfilled') {
        setReportRows(rowsRes.value?.data?.data || rowsRes.value?.data || []);
      } else {
        setReportRows([]);
      }
      if (indRes.status === 'fulfilled') {
        setIndicadores(indRes.value?.data?.data || indRes.value?.data);
      } else {
        setIndicadores(null);
      }
    }).finally(() => setLoading(false));
  }, [period, gestor, orgaoSelecionado, customStart, customEnd, user?.perfil]);

  useEffect(() => {
    orgaoService.listar().then((response) => {
      const list = response.data?.data || response.data || [];
      setOrgaos(list.filter((o) => o.ativo !== false));
    }).catch(() => setOrgaos([]));
  }, []);

  useEffect(() => {
    if (user?.perfil === 'GESTOR') {
      setGestores([]);
      setGestor('');
      return undefined;
    }

    gestorService.listar().then((response) => {
      const data = response.data?.data || response.data || [];
      setGestores([...new Set(data.map((item) => item.nome).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR')));
    }).catch(() => setGestores([]));
    return undefined;
  }, [user?.perfil]);

  // Carrega dados analíticos avançados das consultas SQL (SLA, Ranking, CSAT, Gargalos)
  useEffect(() => {
    let cancelled = false;
    setLoadingAnalytics(true);
    const params = {
      ...getPeriod(),
      ...(gestor ? { gestor } : {}),
      ...(orgaoSelecionado ? { orgaoId: orgaoSelecionado } : {}),
      ...(activeTab === 'gargalos' && analyticsFilter?.tab === 'gargalos' && analyticsFilter.type === 'bairro'
        ? { bairro: analyticsFilter.value } : {}),
      ...(activeTab === 'gargalos' && analyticsFilter?.tab === 'gargalos' && analyticsFilter.type === 'turno'
        ? { diaNum: analyticsFilter.diaNum, turno: analyticsFilter.turno } : {})
    };
    analyticsService.dashboardAvancado(params)
      .then((res) => {
        if (!cancelled) setAnalyticsData(res.data?.data || res.data || null);
      })
      .catch((err) => console.error('Erro ao carregar dados analíticos em relatórios:', err))
      .finally(() => {
        if (!cancelled) setLoadingAnalytics(false);
      });
    return () => { cancelled = true; };
  }, [period, customStart, customEnd, gestor, orgaoSelecionado, activeTab, analyticsFilter]);

  const effectivePeriod = getPeriod();
  const periodLabel = customStart || customEnd
    ? `${effectivePeriod.inicio} a ${effectivePeriod.fim}`
    : (period || 'Este mês');
  const geradoEm = new Date().toLocaleString('pt-BR');
  const orgaoObj = orgaos.find((o) => String(o.id) === String(orgaoSelecionado));
  const orgaoLabel = orgaoObj ? ` | Órgão: ${orgaoObj.sigla || orgaoObj.nome}` : (user?.orgaoNome ? ` | Órgão: ${user.orgaoNome}` : '');
  const regionLabel = selectedRegion ? ` | Região: ${selectedRegion}` : '';
  const activeReportTitle = {
    geral: 'Visão Geral e Indicadores',
    sla: 'SLA e Produtividade por Categoria',
    equipes: 'Ranking e Performance das Equipes',
    satisfacao: 'Satisfação do Cidadão e CSAT',
    gargalos: 'Gargalos Urbanos e Turnos',
  }[activeTab];
  const hasCsatEvaluations = Number(analyticsData?.satisfacaoCidadao?.totalAvaliadas || 0) > 0;
  const toggleInsight = (filter) => {
    setSelectedInsight(current => current?.type === filter.type && current?.value === filter.value ? null : filter);
  };
  const clearInsightFilter = () => setSelectedInsight(null);
  const toggleAnalyticsFilter = (filter) => {
    setAnalyticsFilter((current) => current?.tab === activeTab && current?.value === filter.value
      ? null
      : { ...filter, tab: activeTab });
  };
  const selectShiftBar = (entry) => {
    const row = entry?.payload || entry;
    if (!row?.diaNum || !row?.turno) return;
    toggleAnalyticsFilter({
      type: 'turno', value: `${row.diaNum}-${row.turno}`, diaNum: row.diaNum,
      diaNome: row.diaNome, turno: row.turno, label: `${row.diaNome} · ${row.turno}`,
    });
  };

  const slaRows = analyticsData?.analiseSla || [];
  const rankingRows = analyticsData?.performanceEquipes || [];
  const feedbackRows = analyticsData?.satisfacaoCidadao?.feedbacksRecentes || [];
  const shiftRows = analyticsData?.distribuicaoTurnos || [];
  const labeledShiftRows = shiftRows.map((row) => ({
    ...row,
    periodo: row.periodo || `${row.diaNome} · ${row.turno}`,
  }));
  const bottleneckRows = analyticsData?.gargalosUrbanos || [];
  const isAnalyticsFilterActive = analyticsFilter?.tab === activeTab;
  const visibleSlaRows = isAnalyticsFilterActive && analyticsFilter.type === 'categoria'
    ? slaRows.filter((row) => row.categoria === analyticsFilter.value) : slaRows;
  const visibleRankingRows = isAnalyticsFilterActive && analyticsFilter.type === 'equipe'
    ? rankingRows.filter((row) => String(row.equipeId) === String(analyticsFilter.value)) : rankingRows;
  const visibleFeedbackRows = isAnalyticsFilterActive && analyticsFilter.type === 'feedbackCategoria'
    ? feedbackRows.filter((row) => row.categoria === analyticsFilter.value) : feedbackRows;
  const visibleShiftRows = isAnalyticsFilterActive && analyticsFilter.type === 'turno'
    ? labeledShiftRows.filter((row) => row.diaNome === analyticsFilter.diaNome && row.turno === analyticsFilter.turno) : labeledShiftRows;
  const visibleBottleneckRows = isAnalyticsFilterActive && analyticsFilter.type === 'bairro'
    ? bottleneckRows.filter((row) => row.bairro === analyticsFilter.value) : bottleneckRows;

  const filteredReportRows = useMemo(() => reportRows.filter(row => {
    if (!matchesRegion(row.endereco, row.gps, selectedRegion)) return false;
    if (!selectedInsight) return true;
    if (selectedInsight.type === 'status') return selectedInsight.values.includes(row.status);
    if (selectedInsight.type === 'category') return row.categoria === selectedInsight.value;
    if (selectedInsight.type === 'region') {
      return matchesRegion(row.endereco, row.gps, selectedInsight.value);
    }
    if (selectedInsight.type === 'priority') {
      return ['ALTA', 'URGENTE'].includes((row.prioridade || '').toUpperCase())
        && !['CONCLUIDA', 'CANCELADA'].includes(row.status);
    }
    if (selectedInsight.type === 'month') return String(row.dataCriacao || '').slice(0, 7) === selectedInsight.value;
    return true;
  }), [reportRows, selectedRegion, selectedInsight]);

  const { totalSolicitacoes, kpiData, catData, statusData, tendencia, visibleTerritorial, matrizIA } = useMemo(() => {
    const total = filteredReportRows.length;
    const concluded = filteredReportRows.filter(row => row.status === 'CONCLUIDA').length;
    const inProgress = filteredReportRows.filter(row => ['EM_ANDAMENTO', 'EM_CAMPO'].includes(row.status)).length;
    const open = filteredReportRows.filter(row => ['PENDENTE', 'TRIAGEM'].includes(row.status)).length;
    const urgent = filteredReportRows.filter(row => ['ALTA', 'URGENTE'].includes((row.prioridade || '').toUpperCase())
      && !['CONCLUIDA', 'CANCELADA'].includes(row.status)).length;

    const categoryCounts = new Map();
    const statusCounts = new Map();
    const regionCounts = new Map();
    const monthCounts = new Map();
    const matrixCounts = new Map();

    filteredReportRows.forEach(row => {
      const category = row.categoria || 'Não informada';
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
      statusCounts.set(row.status || 'INDEFINIDO', (statusCounts.get(row.status || 'INDEFINIDO') || 0) + 1);
      const matrixKey = [category, row.prioridade || 'Não informada', row.equipe || 'Sem equipe'].join('|');
      matrixCounts.set(matrixKey, (matrixCounts.get(matrixKey) || 0) + 1);

      const region = resolveRegionFromLocation(row.endereco, row.gps);
      const regionEntry = regionCounts.get(region) || { total: 0, abertas: 0, concluidas: 0, urgentes: 0 };
      regionEntry.total += 1;
      if (['PENDENTE', 'TRIAGEM', 'EM_ANDAMENTO', 'EM_CAMPO'].includes(row.status)) regionEntry.abertas += 1;
      if (row.status === 'CONCLUIDA') regionEntry.concluidas += 1;
      if (['ALTA', 'URGENTE'].includes((row.prioridade || '').toUpperCase())
          && !['CONCLUIDA', 'CANCELADA'].includes(row.status)) regionEntry.urgentes += 1;
      regionCounts.set(region, regionEntry);

      const monthKey = String(row.dataCriacao || '').slice(0, 7);
      if (monthKey.length === 7) monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
    });

    const categories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nome, qtd], index) => ({
        nome,
        qtd,
        pct: total ? Math.round(qtd * 100 / total) : 0,
        color: CAT_COLORS[index % CAT_COLORS.length],
      }));
    const statuses = [...statusCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, total: count }));
    const territories = [...regionCounts.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([regiao, values]) => ({ ...values, regiao, criticidade: values.total ? Math.round(values.urgentes * 100 / values.total) : 0 }));
    const months = [...monthCounts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      const monthName = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });
      return { key, mes: monthName, ano: year, label: `${monthName} ${year}`, total: count };
    });
    const matrix = [...matrixCounts.entries()]
      .map(([key, atendimentos]) => {
        const [servico, prioridade, equipe] = key.split('|');
        return { servico, prioridade, equipe, atendimentos };
      })
      .sort((a, b) => b.atendimentos - a.atendimentos);

    return {
      totalSolicitacoes: total,
      kpiData: { total, concluidas: concluded, emAndamento: inProgress, abertas: open, urgentes: urgent },
      catData: categories,
      statusData: statuses,
      tendencia: months,
      visibleTerritorial: territories,
      matrizIA: matrix,
    };
  }, [filteredReportRows]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const azul = [19, 81, 180];

    doc.setFillColor(...azul);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`Cuidar+Brasil — ${activeReportTitle}`, 14, 12);
    doc.setFontSize(9);
    doc.text(`Período: ${periodLabel}${orgaoLabel}${gestor ? ` | Gestor: ${gestor}` : ''}${regionLabel} | Gerado em: ${geradoEm}`, 14, 20);

    if (activeTab !== 'geral') {
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(12);
      const addTable = (title, head, body) => {
        const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 38;
        doc.text(title, 14, startY - 4);
        autoTable(doc, { startY, head: [head], body, headStyles: { fillColor: azul } });
      };

      if (activeTab === 'sla') {
        addTable('Conformidade de SLA por categoria',
          ['Categoria', 'Demandas', 'Concluídas', 'No prazo', 'Atrasadas', 'SLA'],
          visibleSlaRows.map((row) => [row.categoria, row.totalDemandas, row.concluidas, row.dentroPrazo,
            (row.concluidasAtraso || 0) + (row.ativasEstouradas || 0), `${row.conformidadeSlaPct}%`]));
      }
      if (activeTab === 'equipes') {
        addTable('Ranking de eficiência das equipes',
          ['Rank', 'Equipe', 'Órgão', 'Demandas', 'Concluídas', 'Taxa', 'Avaliação'],
          visibleRankingRows.map((row) => [`${row.rankPosicao}º`, row.equipeNome, row.orgaoSigla, row.totalDemandas,
            row.concluidas, `${row.taxaConclusao}%`, row.notaMedia > 0 ? `${row.notaMedia}/5` : 'N/D']));
      }
      if (activeTab === 'satisfacao') {
        const csat = analyticsData?.satisfacaoCidadao || {};
        addTable('Indicadores de satisfação', ['Indicador', 'Valor'], [
          ['Avaliações', csat.totalAvaliadas ?? 0],
          ['CSAT positivo', hasCsatEvaluations ? `${csat.csatPct}%` : 'N/D'],
          ['Média geral', hasCsatEvaluations ? `${csat.mediaGeral}/5` : 'N/D'],
          ['Qualidade', hasCsatEvaluations ? `${csat.mediaQualidade}/5` : 'N/D'],
          ['Prazo', hasCsatEvaluations ? `${csat.mediaPrazos}/5` : 'N/D'],
          ['Atendimento', hasCsatEvaluations ? `${csat.mediaAtendimento}/5` : 'N/D'],
        ]);
        addTable('Feedbacks recentes', ['Protocolo', 'Categoria', 'Nota', 'Cidadão', 'Comentário'],
          visibleFeedbackRows.map((row) => [row.protocolo, row.categoria, row.mediaNota, row.cidadao, row.comentario]));
      }
      if (activeTab === 'gargalos') {
        addTable('Demanda por dia e turno', ['Dia', 'Turno', 'Demandas'],
          visibleShiftRows.map((row) => [row.diaNome, row.turno, row.total]));
        addTable('Gargalos por bairro',
          ['Rank', 'Bairro', 'Demandas', 'Pendentes', 'Em atendimento', 'Concluídas', 'Urgentes', 'Espera média'],
          visibleBottleneckRows.map((row) => [row.rankCriticidade, row.bairro, row.totalDemandas, row.pendentes,
            row.emAtendimento, row.concluidas, row.urgentesAtivas, `${row.mediaDiasEspera} dias`]));
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        doc.setPage(page);
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(`Cuidar+Brasil GovTech — Página ${page} de ${pageCount}`, 14, 290);
      }
      doc.save(`relatorio-${activeTab}-cuidar-brasil-${new Date().toISOString().slice(0, 10)}.pdf`);
      return;
    }

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
          [user?.perfil === 'GESTOR' ? 'Cidadãos com solicitações na equipe' : 'Cidadãos cadastrados', indicadores.cidadaosCadastrados ?? 0],
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

    if (visibleTerritorial.length > 0) {
      doc.text('Inteligência Territorial (por região)', 14, doc.lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Região', 'Total', 'Abertas', 'Concluídas', 'Urgentes', 'Criticidade']],
        body: visibleTerritorial.slice(0, 15).map(t => [t.regiao, t.total, t.abertas, t.concluidas, t.urgentes, `${t.criticidade}%`]),
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className={styles.title}>Relatórios Executivos e Analíticos</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
              Consultas analíticas, conformidade de SLA, ranking de equipes e monitoramento municipal
            </p>
          </div>
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

      {/* Abas de navegação do Relatório */}
      <div className={styles.dashNavTabs} style={{ marginBottom: 16 }}>
        <button
          className={[styles.dashNavBtn, activeTab === 'geral' ? styles.dashNavBtnActive : ''].join(' ')}
          onClick={() => setActiveTab('geral')}
        >
          <BarChart3 size={15} /> Visão Geral & Indicadores
        </button>
        <button
          className={[styles.dashNavBtn, activeTab === 'sla' ? styles.dashNavBtnActive : ''].join(' ')}
          onClick={() => setActiveTab('sla')}
        >
          <Clock size={15} /> SLA & Produtividade (SQL CTE)
        </button>
        <button
          className={[styles.dashNavBtn, activeTab === 'equipes' ? styles.dashNavBtnActive : ''].join(' ')}
          onClick={() => setActiveTab('equipes')}
        >
          <Award size={15} /> Ranking de Equipes (DENSE_RANK)
        </button>
        <button
          className={[styles.dashNavBtn, activeTab === 'satisfacao' ? styles.dashNavBtnActive : ''].join(' ')}
          onClick={() => setActiveTab('satisfacao')}
        >
          <Star size={15} /> Satisfação & CSAT do Cidadão
        </button>
        <button
          className={[styles.dashNavBtn, activeTab === 'gargalos' ? styles.dashNavBtnActive : ''].join(' ')}
          onClick={() => setActiveTab('gargalos')}
        >
          <AlertTriangle size={15} /> Gargalos Urbanos & Turnos
        </button>
      </div>

      {/* Period filter */}
      <div className={styles.periodBar}>
        <div className={styles.periodTabs}>
          {PERIODS.map(p => (
            <button key={p} className={[styles.periodTab, !customStart && !customEnd && period === p ? styles.periodActive : ''].join(' ')} onClick={() => { setPeriod(p); setCustomStart(''); setCustomEnd(''); }}>{p}</button>
          ))}
        </div>
        <div className={styles.customRange}>
          <input type="date" className={styles.dateInput} aria-label="Data inicial" max={customEnd || formatDate(new Date())} value={customStart} onChange={(event) => { setPeriod(''); setCustomStart(event.target.value); }}/>
          <span>→</span>
          <input type="date" className={styles.dateInput} aria-label="Data final" min={customStart || undefined} max={formatDate(new Date())} value={customEnd} onChange={(event) => { setPeriod(''); setCustomEnd(event.target.value); }}/>
        </div>
        {orgaos.length > 1 && (
          <select className={styles.dateInput} value={orgaoSelecionado} onChange={(event) => setOrgaoSelecionado(event.target.value)}>
            <option value="">Todos os órgãos</option>
            {orgaos.map((o) => <option key={o.id} value={o.id}>{o.sigla ? `${o.sigla} - ${o.nome}` : o.nome}</option>)}
          </select>
        )}
        {user?.perfil !== 'GESTOR' && (
          <select className={styles.dateInput} value={gestor} onChange={(event) => setGestor(event.target.value)}>
            <option value="">Todos os gestores</option>
            {gestores.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
          </select>
        )}
        <button className={styles.exportBtn} onClick={() => setShowReport(true)} disabled={loading}>
          <FileText size={16} style={{verticalAlign: 'middle', marginRight: 6}}/>Visualizar Relatório
        </button>
      </div>

      {activeTab !== 'geral' && isAnalyticsFilterActive && (
        <div className={styles.activeInsightFilter}>
          <span>Filtro cruzado: {analyticsFilter.label}</span>
          <button type="button" onClick={() => setAnalyticsFilter(null)}>Limpar filtro</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* ABA 1: VISÃO GERAL & INDICADORES                               */}
      {/* ============================================================== */}
      {activeTab === 'geral' && (
        <>
          {selectedInsight && (
            <div className={styles.activeInsightFilter}>
              <span>Filtro cruzado: {selectedInsight.label}</span>
              <button type="button" onClick={clearInsightFilter}>Limpar filtro</button>
            </div>
          )}
          {/* KPI Cards — dados reais */}
          <div className={styles.kpis}>
        {[
          {
            label: 'TOTAL DE CHAMADOS',
            value: loading ? '...' : totalSolicitacoes.toLocaleString('pt-BR'),
            sub: 'no escopo e período filtrados',
            color: 'gray',
            filter: { type: 'clear', value: 'all', label: 'Todos os registros' },
          },
          {
            label: 'CONCLUÍDAS',
            value: loading ? '...' : (kpiData?.concluidas ?? 0),
            sub: 'total concluídas',
            color: 'green',
            filter: { type: 'status', value: 'CONCLUIDA', values: ['CONCLUIDA'], label: 'Status: Concluídas' },
          },
          {
            label: 'URGENTES ABERTAS',
            value: loading ? '...' : (kpiData?.urgentes ?? 0),
            sub: 'requerem ação',
            color: 'orange',
            filter: { type: 'priority', value: 'URGENTE_ALTA', label: 'Prioridade: Alta ou urgente' },
          },
          {
            label: 'EM ANDAMENTO',
            value: loading ? '...' : (kpiData?.emAndamento ?? 0),
            sub: 'total em andamento',
            color: 'yellow',
            filter: { type: 'status', value: 'EM_ANDAMENTO', values: ['EM_ANDAMENTO', 'EM_CAMPO'], label: 'Status: Em andamento ou em campo' },
          },
        ].map((k, i) => (
          <button key={i} type="button" className={[styles.kpiCard, styles[k.color], styles.kpiInteractive].join(' ')}
            onClick={() => k.filter.type === 'clear' ? clearInsightFilter() : toggleInsight(k.filter)} title={`Filtrar: ${k.filter.label}`}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiVal}>{k.value}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </button>
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
              <AreaChart data={tendencia} margin={{top:5,right:10,left:-20,bottom:0}}
                onClick={(event) => {
                  const point = event?.activePayload?.[0]?.payload;
                  if (point) toggleInsight({ type: 'month', value: point.key, label: `Mês: ${point.mes} ${point.ano}` });
                }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="label" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
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
                  <tr key={i} className={styles.selectableRow} onClick={() => toggleInsight({ type: 'category', value: c.nome, label: `Categoria: ${c.nome}` })}
                    title={`Filtrar todas as visualizações por ${c.nome}`} aria-label={`Filtrar por categoria ${c.nome}`}>
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
          <span className={styles.slaSub}>mesma base filtrada; urgentes é um subconjunto</span>
        </div>
        <div className={styles.slaGrid}>
          {[
            { nome: 'Abertas (Pendente + Triagem)', count: kpiData.abertas, pct: Math.min(100, Math.round(kpiData.abertas / Math.max(totalSolicitacoes, 1) * 100)), color: '#F2994A', filter: { type: 'status', value: 'open', values: ['PENDENTE', 'TRIAGEM'], label: 'Status: Abertas' } },
            { nome: 'Em Andamento + Campo', count: kpiData.emAndamento, pct: Math.min(100, Math.round(kpiData.emAndamento / Math.max(totalSolicitacoes, 1) * 100)), color: '#2F80ED', filter: { type: 'status', value: 'progress', values: ['EM_ANDAMENTO', 'EM_CAMPO'], label: 'Status: Em andamento ou em campo' } },
            { nome: 'Concluídas', count: kpiData.concluidas, pct: Math.min(100, Math.round(kpiData.concluidas / Math.max(totalSolicitacoes, 1) * 100)), color: '#27AE60', filter: { type: 'status', value: 'done', values: ['CONCLUIDA'], label: 'Status: Concluídas' } },
            { nome: 'Urgentes em Aberto', count: kpiData.urgentes, pct: Math.min(100, Math.round(kpiData.urgentes / Math.max(totalSolicitacoes, 1) * 100)), color: '#EB5757', filter: { type: 'priority', value: 'URGENTE_ALTA', label: 'Prioridade: Alta ou urgente' } },
          ].map((s, i) => (
            <button key={i} type="button" className={[styles.slaRow, styles.statusInsightButton].join(' ')}
              onClick={() => toggleInsight(s.filter)} title={`${s.count} solicitações (${s.pct}%). Clique para cruzar os dados.`} aria-pressed={selectedInsight?.value === s.filter.value}>
              <span className={styles.slaName}>{s.nome}</span>
              <div className={styles.slaBar}>
                <div className={styles.slaFill} style={{width: s.pct + '%', background: s.color}}/>
              </div>
              <span className={styles.slaPct} style={{color: s.color}}>{loading ? '...' : `${s.count} · ${s.pct}%`}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Matriz Serviço x Prioridade x Equipe (IA) */}
      <div className={styles.slaCard} style={{marginTop: 16}}>
        <div className={styles.slaHeader}>
          <h3>Matriz Serviço × Prioridade × Equipe (IA)</h3>
          <span className={styles.slaSub}>agrupada pelas mesmas ocorrências e filtros desta visão</span>
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
        {visibleTerritorial.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sem dados territoriais ainda.</p>
        ) : (
          <table className={styles.catTable}>
            <thead>
              <tr><th>REGIÃO</th><th>TOTAL</th><th>ABERTAS</th><th>CONCLUÍDAS</th><th>URGENTES</th><th>CRITICIDADE</th></tr>
            </thead>
            <tbody>
              {visibleTerritorial.slice(0, 10).map((t, i) => (
                <tr key={i} className={styles.selectableRow} onClick={() => toggleInsight({ type: 'region', value: t.regiao, label: `Região: ${t.regiao}` })}
                  title={`Filtrar todas as visualizações por ${t.regiao}`} aria-label={`Filtrar por região ${t.regiao}`}>
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
                      <BarChart data={visibleSlaRows} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="categoria" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Conformidade SLA']} />
                        <Bar dataKey="conformidadeSlaPct" fill="#27AE60" radius={[4, 4, 0, 0]} cursor="pointer"
                          onClick={(entry) => entry?.payload && toggleAnalyticsFilter({ type: 'categoria', value: entry.payload.categoria, label: `Categoria: ${entry.payload.categoria}` })} />
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
                        {visibleSlaRows.length
                          ? Math.round(visibleSlaRows.reduce((acc, curr) => acc + curr.conformidadeSlaPct, 0) / visibleSlaRows.length)
                          : 0}%
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className={styles.dimCard}>
                        <div className={styles.dimLabel}>NO PRAZO</div>
                        <div className={styles.dimVal} style={{ color: '#27AE60' }}>
                          {visibleSlaRows.reduce((acc, curr) => acc + curr.dentroPrazo, 0)}
                        </div>
                      </div>
                      <div className={styles.dimCard}>
                        <div className={styles.dimLabel}>EM ATRASO</div>
                        <div className={styles.dimVal} style={{ color: '#EB5757' }}>
                          {visibleSlaRows.reduce((acc, curr) => acc + curr.concluidasAtraso + curr.ativasEstouradas, 0)}
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
                      {visibleSlaRows.map((row, idx) => (
                        <tr key={idx} className={styles.selectableRow} onClick={() => toggleAnalyticsFilter({ type: 'categoria', value: row.categoria, label: `Categoria: ${row.categoria}` })}
                          aria-selected={isAnalyticsFilterActive && analyticsFilter.value === row.categoria}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', marginBottom: '20px' }}>
                {visibleRankingRows.slice(0, 3).map((team, idx) => (
                  <button type="button" key={team.equipeId} className={`${styles.advCard} ${styles.advCardInteractive}`} onClick={() => toggleAnalyticsFilter({ type: 'equipe', value: team.equipeId, label: `Equipe: ${team.equipeNome}` })}
                    aria-pressed={isAnalyticsFilterActive && String(analyticsFilter.value) === String(team.equipeId)}
                    style={{ borderTop: `4px solid ${idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32'}` }}>
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
                        <div className={styles.dimVal} style={{ color: '#F2C94C' }}>{team.notaMedia > 0 ? `★ ${team.notaMedia}` : 'N/D'}</div>
                      </div>
                    </div>
                  </button>
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
                      {visibleRankingRows.map((team) => (
                        <tr key={team.equipeId} className={styles.selectableRow} onClick={() => toggleAnalyticsFilter({ type: 'equipe', value: team.equipeId, label: `Equipe: ${team.equipeNome}` })}
                          aria-selected={isAnalyticsFilterActive && String(analyticsFilter.value) === String(team.equipeId)}>
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
                            {team.notaMedia > 0 ? `★ ${team.notaMedia}` : 'N/D'}
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
                        {hasCsatEvaluations ? `${analyticsData.satisfacaoCidadao.csatPct}%` : 'N/D'}
                      </div>
                      <div className={styles.csatScoreLabel}>Aprovações Positivas (Nota ≥ 4)</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {hasCsatEvaluations ? `★ ${analyticsData.satisfacaoCidadao.mediaGeral}` : 'N/D'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Média em 5.0 estrelas</div>
                    </div>
                  </div>

                  {/* 3 Dimensões */}
                  <div className={styles.ratingDims}>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>QUALIDADE</div>
                      <div className={styles.dimVal}>{hasCsatEvaluations ? `★ ${analyticsData.satisfacaoCidadao.mediaQualidade}` : 'N/D'}</div>
                    </div>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>PRAZOS</div>
                      <div className={styles.dimVal}>{hasCsatEvaluations ? `★ ${analyticsData.satisfacaoCidadao.mediaPrazos}` : 'N/D'}</div>
                    </div>
                    <div className={styles.dimCard}>
                      <div className={styles.dimLabel}>ATENDIMENTO</div>
                      <div className={styles.dimVal}>{hasCsatEvaluations ? `★ ${analyticsData.satisfacaoCidadao.mediaAtendimento}` : 'N/D'}</div>
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
                    {visibleFeedbackRows.map((fb, idx) => (
                      <div key={fb.id || fb.protocolo || idx} className={styles.feedbackCard}>
                        <div className={styles.feedbackCardTop}>
                          <span className={styles.feedbackProto}>
                            <Link className={styles.feedbackProtocolLink}
                              to={fb.id ? `/ocorrencia/${fb.id}` : `/ocorrencia/protocolo/${encodeURIComponent(fb.protocolo)}`}
                              aria-label={`Abrir ocorrência ${fb.protocolo}`}>
                              {fb.protocolo}
                            </Link>
                            <span> · </span>
                            <button type="button" className={styles.feedbackCategoryButton}
                              onClick={() => toggleAnalyticsFilter({ type: 'feedbackCategoria', value: fb.categoria, label: `Feedbacks de ${fb.categoria}` })}>
                              {fb.categoria}
                            </button>
                          </span>
                          <span className={styles.feedbackStars}>★ {fb.mediaNota}</span>
                        </div>
                        <p className={styles.feedbackText}>"{fb.comentario}"</p>
                        <div className={styles.feedbackAuthor}>Por {fb.cidadao}</div>
                      </div>
                    ))}
                    {visibleFeedbackRows.length === 0 && (
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
                      <BarChart data={visibleShiftRows} margin={{ top: 10, right: 10, left: -20, bottom: 42 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="periodo" interval={0} angle={-35} textAnchor="end" height={48} tick={{ fontSize: 9 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#2F80ED" radius={[4, 4, 0, 0]} cursor="pointer" onClick={selectShiftBar} />
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
                    {visibleBottleneckRows.slice(0, 5).map((b, i) => (
                      <button type="button" key={i} className={styles.bottleneckRow}
                        onClick={() => toggleAnalyticsFilter({ type: 'bairro', value: b.bairro, label: `Bairro: ${b.bairro}` })}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{b.bairro}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tempo médio de espera: {b.mediaDiasEspera} dias</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: 'rgba(235, 87, 87, 0.12)', color: '#EB5757', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {b.urgentesAtivas} urgentes
                          </span>
                        </div>
                      </button>
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
                      {visibleBottleneckRows.map((b, idx) => (
                        <tr key={idx} className={styles.selectableRow} onClick={() => toggleAnalyticsFilter({ type: 'bairro', value: b.bairro, label: `Bairro: ${b.bairro}` })}
                          aria-selected={isAnalyticsFilterActive && analyticsFilter.value === b.bairro}>
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

      {/* Modal: Relatório em tela antes da exportação */}
      {showReport && (
        <div className={styles.reportOverlay} onClick={() => setShowReport(false)}>
          <div className={styles.reportModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reportHeader}>
              <div>
                <h2>{activeReportTitle} — Cuidar+Brasil</h2>
                <p>Período: {periodLabel}{orgaoLabel}{gestor ? ` | Gestor: ${gestor}` : ''}{regionLabel} | Gerado em: {geradoEm}</p>
              </div>
              <div className={styles.reportActions}>
                <button className={styles.exportBtn} onClick={exportPDF}>
                  <Download size={16} style={{verticalAlign: 'middle', marginRight: 6}}/>Exportar PDF
                </button>
                <button className={styles.closeBtn} onClick={() => setShowReport(false)} aria-label="Fechar"><X size={20}/></button>
              </div>
            </div>

            <div className={styles.reportBody}>
              {activeTab === 'geral' && (
                <>
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
                      <tr><td>{user?.perfil === 'GESTOR' ? 'Cidadãos com solicitações na equipe' : 'Cidadãos cadastrados'}</td><td style={{fontWeight:700}}>{indicadores.cidadaosCadastrados ?? 0}</td></tr>
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

              {visibleTerritorial.length > 0 && (
                <>
                  <h3>5. Inteligência Territorial</h3>
                  <table className={styles.catTable}>
                    <thead><tr><th>REGIÃO</th><th>TOTAL</th><th>ABERTAS</th><th>CONCLUÍDAS</th><th>URGENTES</th></tr></thead>
                    <tbody>
                      {visibleTerritorial.slice(0, 15).map((t, i) => (
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
                </>
              )}

              {activeTab === 'sla' && (
                <>
                  <h3>Conformidade de SLA por categoria</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.catTable}>
                      <thead><tr><th>CATEGORIA</th><th>DEMANDAS</th><th>CONCLUÍDAS</th><th>NO PRAZO</th><th>ATRASADAS</th><th>CONFORMIDADE</th></tr></thead>
                      <tbody>{visibleSlaRows.map((row, index) => <tr key={index}><td>{row.categoria}</td><td>{row.totalDemandas}</td><td>{row.concluidas}</td><td>{row.dentroPrazo}</td><td>{(row.concluidasAtraso || 0) + (row.ativasEstouradas || 0)}</td><td>{row.conformidadeSlaPct}%</td></tr>)}</tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === 'equipes' && (
                <>
                  <h3>Ranking de eficiência das equipes</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.catTable}>
                      <thead><tr><th>RANK</th><th>EQUIPE</th><th>ÓRGÃO</th><th>DEMANDAS</th><th>CONCLUÍDAS</th><th>RESOLUTIVIDADE</th><th>NOTA</th></tr></thead>
                      <tbody>{visibleRankingRows.map((row, index) => <tr key={index}><td>{row.rankPosicao}º</td><td>{row.equipeNome}</td><td>{row.orgaoSigla}</td><td>{row.totalDemandas}</td><td>{row.concluidas}</td><td>{row.taxaConclusao}%</td><td>{row.notaMedia > 0 ? `${row.notaMedia}/5` : 'N/D'}</td></tr>)}</tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === 'satisfacao' && (
                <>
                  <h3>Indicadores de satisfação</h3>
                  <table className={styles.catTable}>
                    <tbody>
                      <tr><td>Avaliações</td><td>{analyticsData?.satisfacaoCidadao?.totalAvaliadas ?? 0}</td></tr>
                      <tr><td>CSAT positivo</td><td>{hasCsatEvaluations ? `${analyticsData.satisfacaoCidadao.csatPct}%` : 'N/D'}</td></tr>
                      <tr><td>Média geral</td><td>{hasCsatEvaluations ? `${analyticsData.satisfacaoCidadao.mediaGeral}/5` : 'N/D'}</td></tr>
                      <tr><td>Qualidade / Prazo / Atendimento</td><td>{hasCsatEvaluations ? `${analyticsData.satisfacaoCidadao.mediaQualidade} / ${analyticsData.satisfacaoCidadao.mediaPrazos} / ${analyticsData.satisfacaoCidadao.mediaAtendimento}` : 'N/D'}</td></tr>
                    </tbody>
                  </table>
                  <h3>Feedbacks recentes</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.catTable}>
                      <thead><tr><th>PROTOCOLO</th><th>CATEGORIA</th><th>NOTA</th><th>CIDADÃO</th><th>COMENTÁRIO</th></tr></thead>
                      <tbody>{visibleFeedbackRows.map((row, index) => <tr key={index}><td><Link className={styles.feedbackProtocolLink} to={row.id ? `/ocorrencia/${row.id}` : `/ocorrencia/protocolo/${encodeURIComponent(row.protocolo)}`}>{row.protocolo}</Link></td><td>{row.categoria}</td><td>{row.mediaNota}</td><td>{row.cidadao}</td><td>{row.comentario}</td></tr>)}</tbody>
                    </table>
                  </div>
                </>
              )}

              {activeTab === 'gargalos' && (
                <>
                  <h3>Demanda por dia e turno</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.catTable}>
                      <thead><tr><th>DIA</th><th>TURNO</th><th>DEMANDAS</th></tr></thead>
                      <tbody>{visibleShiftRows.map((row, index) => <tr key={index}><td>{row.diaNome}</td><td>{row.turno}</td><td>{row.total}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <h3>Gargalos por bairro</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.catTable}>
                      <thead><tr><th>RANK</th><th>BAIRRO</th><th>DEMANDAS</th><th>PENDENTES</th><th>EM ATENDIMENTO</th><th>CONCLUÍDAS</th><th>URGENTES</th><th>ESPERA MÉDIA</th></tr></thead>
                      <tbody>{visibleBottleneckRows.map((row, index) => <tr key={index}><td>{row.rankCriticidade}º</td><td>{row.bairro}</td><td>{row.totalDemandas}</td><td>{row.pendentes}</td><td>{row.emAtendimento}</td><td>{row.concluidas}</td><td>{row.urgentesAtivas}</td><td>{row.mediaDiasEspera} dias</td></tr>)}</tbody>
                    </table>
                  </div>
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

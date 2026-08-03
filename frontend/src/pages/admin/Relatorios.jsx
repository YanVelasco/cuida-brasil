import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { relatorioService, dashboardService } from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import styles from './Relatorios.module.css';

const PERIODS = ['Esta semana', 'Este mês', 'Último trimestre', 'Anual'];
const CAT_COLORS = ['#2F80ED', '#27AE60', '#9B51E0', '#F2994A', '#EB5757'];

export default function Relatorios() {
  const [period, setPeriod] = useState('Este mês');
  const [catData, setCatData]   = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [kpiData, setKpiData]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.allSettled([
      relatorioService.porCategoria(),
      relatorioService.tendenciaMensal(),
      dashboardService.stats(),
    ]).then(([catRes, tendRes, kpiRes]) => {
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
    }).finally(() => setLoading(false));
  }, []);

  const totalSolicitacoes = catData.reduce((sum, c) => sum + (c.qtd || 0), 0);
  const taxaResolucao = kpiData && kpiData.totalAbertas + kpiData.resolvidasHoje > 0
    ? Math.round(kpiData.resolvidasHoje / (kpiData.totalAbertas + kpiData.resolvidasHoje) * 100)
    : 0;

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Relatórios</h1>
      </div>

      {/* Period filter */}
      <div className={styles.periodBar}>
        <div className={styles.periodTabs}>
          {PERIODS.map(p => (
            <button key={p} className={[styles.periodTab, period === p ? styles.periodActive : ''].join(' ')} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <div className={styles.customRange}>
          <input type="date" className={styles.dateInput}/>
          <span>→</span>
          <input type="date" className={styles.dateInput}/>
        </div>
        <button className={styles.exportBtn}>Exportar</button>
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
            value: loading ? '...' : (kpiData?.resolvidasHoje ?? 0),
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
            { nome: 'Abertas (Pendente + Triagem)', pct: kpiData ? Math.min(100, Math.round(kpiData.totalAbertas / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#F2994A' },
            { nome: 'Em Andamento + Campo',          pct: kpiData ? Math.min(100, Math.round(kpiData.emAndamento / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#2F80ED' },
            { nome: 'Concluídas',                    pct: kpiData ? Math.min(100, Math.round(kpiData.resolvidasHoje / Math.max(totalSolicitacoes, 1) * 100)) : 0, color: '#27AE60' },
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
    </AdminLayout>
  );
}

import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis
} from 'recharts';
import styles from './Dashboard.module.css';

const KPI = [
  { label: 'TOTAL ABERTAS', value: 532, color: 'gray' },
  { label: 'EM ANDAMENTO', value: 210, color: 'blue' },
  { label: 'RESOLVIDAS HOJE', value: 124, color: 'green' },
  { label: 'PENDENTES SLA', value: 184, color: 'orange' },
  { label: 'URGENTES', value: 14, color: 'red' },
];

const CHART_DATA = [
  { name: 'Seg', abertas: 45, resolvidas: 30 },
  { name: 'Ter', abertas: 68, resolvidas: 45 },
  { name: 'Qua', abertas: 55, resolvidas: 40 },
  { name: 'Qui', abertas: 80, resolvidas: 55 },
  { name: 'Sex', abertas: 90, resolvidas: 70 },
  { name: 'Sáb', abertas: 60, resolvidas: 50 },
  { name: 'Dom', abertas: 40, resolvidas: 38 },
];

const CAT_DATA = [
  { name: 'Iluminação Pública', pct: 32, color: '#2F80ED' },
  { name: 'Pavimentação', pct: 24, color: '#2F80ED' },
  { name: 'Limpeza Urbana', pct: 18, color: '#2F80ED' },
  { name: 'Poda & Árvores', pct: 14, color: '#9B51E0' },
  { name: 'Outros', pct: 12, color: '#2F80ED' },
];

const SCATTER_DATA = [
  { x: 20, y: 70, color: '#EB5757' },
  { x: 45, y: 30, color: '#F2994A' },
  { x: 60, y: 50, color: '#27AE60' },
  { x: 75, y: 80, color: '#2F80ED' },
  { x: 30, y: 55, color: '#F2C94C' },
  { x: 85, y: 25, color: '#EB5757' },
  { x: 50, y: 70, color: '#27AE60' },
  { x: 15, y: 40, color: '#F2994A' },
];

const TABLE_DATA = [
  { protocolo: '#xxxxxx', endereco: 'xxxxxxxxxxxxxxxxxxxx', status: 'Andamento', tipo: 'Tapa-buraco', prazo: '12 dias', prioridade: 'Alta', prazoType: 'ok' },
  { protocolo: '#xxxxxx', endereco: 'xxxxxxxxxxxxxxxxxxxx', status: 'Em campo', tipo: 'Poda de árvore', prazo: '28 dias', prioridade: 'Média', prazoType: 'ok' },
  { protocolo: '#xxxxxx', endereco: 'xxxxxxxxxxxxxxxxxxxx', status: 'Resolvido', tipo: 'Limpeza de bueiro', prazo: 'Concluído', prioridade: 'Baixa', prazoType: 'ok' },
  { protocolo: '#xxxxxx', endereco: 'xxxxxxxxxxxxxxxxxxxx', status: 'Triagem', tipo: 'Varrição', prazo: 'Hoje', prioridade: 'Urgente', prazoType: 'urgent' },
];

const STATUS_STYLE = {
  'Andamento': { bg: '#2F80ED', color: '#fff' },
  'Em campo': { bg: '#27AE60', color: '#fff' },
  'Resolvido': { bg: '#6FCF97', color: '#fff' },
  'Triagem':   { bg: '#F2994A', color: '#fff' },
};
const PRIO_STYLE = {
  'Alta':    { bg: '#EB5757', color: '#fff' },
  'Média':   { bg: '#F2C94C', color: '#333' },
  'Baixa':   { bg: '#27AE60', color: '#fff' },
  'Urgente': { bg: '#EB5757', color: '#fff' },
};

export default function Dashboard() {
  const [chartTab, setChartTab] = useState('Semana');
  const [search, setSearch] = useState('');

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Geral</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.stats}>
        {KPI.map((k, i) => (
          <div key={i} className={[styles.statCard, styles[k.color]].join(' ')}>
            <div className={styles.statLabel}>{k.label}</div>
            <div className={[styles.statValue, styles[k.color]].join(' ')}>{k.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={styles.charts}>
        {/* Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}></span>
            <div className={styles.chartTabBtns}>
              {['Semana', 'Mês'].map(t => (
                <button key={t} className={[styles.chartTabBtn, chartTab===t ? styles.active : ''].join(' ')} onClick={() => setChartTab(t)}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barSize={10} barGap={2}>
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
            <span className={styles.chartTitle}></span>
          </div>
          {CAT_DATA.map((c, i) => (
            <div key={i} className={styles.catRow}>
              <span className={styles.catName}>{c.name}</span>
              <div className={styles.catBar}><div className={styles.catFill} style={{width:c.pct+'%', background:c.color}}/></div>
              <span className={styles.catPct}>{c.pct}%</span>
            </div>
          ))}
        </div>

        {/* Scatter Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}></span>
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <ScatterChart margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} axisLine={false} tickLine={false}/>
              <ZAxis range={[60, 60]}/>
              <Tooltip/>
              <Scatter data={SCATTER_DATA}>
                {SCATTER_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.color}/>
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            {['Urgente','Pendente','Em campo','Resolvido'].map((l,i) => (
              <span key={i} className={styles.legendItem}>
                <span className={styles.legendDot} style={{background:['#EB5757','#F2994A','#2F80ED','#27AE60'][i]}}/>
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <span className={styles.tableHeaderLeft}></span>
          <div className={styles.tableActions}>
            <input className={styles.searchInput} placeholder="Buscar protocolo..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <button className={styles.newBtn}>+ Novo</button>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PROTOCOLO</th>
                <th>ENDEREÇO</th>
                <th>STATUS</th>
                <th>TIPO DE SERVIÇO</th>
                <th>PRAZO</th>
                <th>PRIORIDADE</th>
                <th>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {TABLE_DATA.map((row, i) => (
                <tr key={i}>
                  <td className={styles.proto}>{row.protocolo}</td>
                  <td className={styles.muted}>{row.endereco}</td>
                  <td>
                    <span style={{
                      background: STATUS_STYLE[row.status]?.bg,
                      color: STATUS_STYLE[row.status]?.color,
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}>{row.status}</span>
                  </td>
                  <td>{row.tipo}</td>
                  <td className={[styles.prazo, styles[row.prazoType]].join(' ')}>{row.prazo}</td>
                  <td>
                    <span style={{
                      background: PRIO_STYLE[row.prioridade]?.bg,
                      color: PRIO_STYLE[row.prioridade]?.color,
                      padding: '3px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>{row.prioridade}</span>
                  </td>
                  <td><button className={styles.viewBtn}>Ver</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

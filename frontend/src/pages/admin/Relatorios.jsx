import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import styles from './Relatorios.module.css';

const PERIODS = ['Esta semana', 'Este mês', 'Último trimestre', 'Anual'];

const CHART_DATA = [
  { mes:'Jun', abertas:90, resolvidas:60 },
  { mes:'Jul', abertas:110, resolvidas:80 },
  { mes:'Ago', abertas:130, resolvidas:100 },
  { mes:'Set', abertas:120, resolvidas:110 },
  { mes:'Out', abertas:160, resolvidas:130 },
  { mes:'Nov', abertas:190, resolvidas:155 },
  { mes:'Dez', abertas:210, resolvidas:175 },
];

const CAT_TABLE = [
  { nome:'Iluminação Pública', qtd:599, pct:32, color:'#2F80ED' },
  { nome:'Pavimentação', qtd:299, pct:24, color:'#2F80ED' },
  { nome:'Limpeza Urbana', qtd:224, pct:18, color:'#27AE60' },
  { nome:'Poda & Árvores', qtd:175, pct:14, color:'#9B51E0' },
  { nome:'Outros', qtd:150, pct:12, color:'#F2994A' },
];

const SLA_DATA = [
  { nome:'Subpref. 01', pct:80, color:'#27AE60' },
  { nome:'Subpref. 02', pct:60, color:'#F2C94C' },
  { nome:'Subpref. 03', pct:70, color:'#EB5757' },
  { nome:'Subpref. 04', pct:65, color:'#27AE60' },
];

export default function Relatorios() {
  const [period, setPeriod] = useState('Esta semana');

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Relatórios</h1>
      </div>

      {/* Period filter */}
      <div className={styles.periodBar}>
        <div className={styles.periodTabs}>
          {PERIODS.map(p => (
            <button key={p} className={[styles.periodTab, period===p ? styles.periodActive : ''].join(' ')} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <div className={styles.customRange}>
          <input type="date" className={styles.dateInput}/>
          <span>→</span>
          <input type="date" className={styles.dateInput}/>
        </div>
        <button className={styles.exportBtn}>Exportar</button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpis}>
        {[
          { label:'TOTAL DE CHAMADOS', value:'1,247', sub:'+7,8% este mês', color:'gray' },
          { label:'RESOLVIDOS', value:'87%', sub:'taxa de resolução', color:'green' },
          { label:'TEMPO MÉDIO', value:'4.2d', sub:'↓ eventual', color:'orange' },
          { label:'SATISFAÇÃO CIDADÃO', value:'4.1★', sub:'média das avaliações', color:'yellow' },
        ].map((k,i) => (
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
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={CHART_DATA} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="mes" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Area type="monotone" dataKey="abertas" stroke="#2F80ED" fill="rgba(47,128,237,0.08)" strokeWidth={2}/>
              <Area type="monotone" dataKey="resolvidas" stroke="#27AE60" fill="rgba(39,174,96,0.08)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.ldot} style={{background:'#2F80ED'}}/> Abertas</span>
            <span className={styles.legendItem}><span className={styles.ldot} style={{background:'#27AE60'}}/> Resolvidas</span>
          </div>
        </div>

        {/* Por Categoria table */}
        <div className={styles.catCard}>
          <h3>Por Categoria</h3>
          <table className={styles.catTable}>
            <thead><tr><th>CATEGORIA</th><th>QTD</th><th style={{width:120}}></th></tr></thead>
            <tbody>
              {CAT_TABLE.map((c,i) => (
                <tr key={i}>
                  <td>{c.nome}</td>
                  <td style={{fontWeight:700}}>{c.qtd}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                        <div style={{width:c.pct+'%',height:'100%',background:c.color,borderRadius:4}}/>
                      </div>
                      <span style={{fontSize:'0.78rem',fontWeight:700,color:c.color,width:30}}>{c.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA por Órgão */}
      <div className={styles.slaCard}>
        <div className={styles.slaHeader}>
          <h3>SLA por Órgão</h3>
          <span className={styles.slaSub}>8 órgãos dos dados</span>
        </div>
        <div className={styles.slaGrid}>
          {SLA_DATA.map((s,i) => (
            <div key={i} className={styles.slaRow}>
              <span className={styles.slaName}>{s.nome}</span>
              <div className={styles.slaBar}>
                <div className={styles.slaFill} style={{width:s.pct+'%', background:s.color}}/>
              </div>
              <span className={styles.slaPct} style={{color:s.color}}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import { ocorrenciaService } from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search } from 'lucide-react';
import styles from './Solicitacoes.module.css';

const MOCK = [
  { id:1, protocolo:'#xxxxxxxxxx', endereco:'xxxxxxxxxxxxxxxxxxxxxx', status:'Andamento', tipo:'Tapa-buraco', prazo:'12 dias', prioridade:'Alta', prazoType:'ok' },
  { id:2, protocolo:'#xxxxxxxxxx', endereco:'xxxxxxxxxxxxxxxxxxxxxx', status:'Em campo', tipo:'Poda de árvore', prazo:'28 dias', prioridade:'Média', prazoType:'ok' },
  { id:3, protocolo:'#xxxxxxxxxx', endereco:'xxxxxxxxxxxxxxxxxxxxxx', status:'Resolvido', tipo:'Limpeza de bueiro', prazo:'Concluído', prioridade:'Baixa', prazoType:'ok' },
  { id:4, protocolo:'#xxxxxxxxxx', endereco:'xxxxxxxxxxxxxxxxxxxxxx', status:'Triagem', tipo:'Varrição', prazo:'Hoje', prioridade:'Urgente', prazoType:'urgent' },
  { id:5, protocolo:'#xxxxxxxxxx', endereco:'xxxxxxxxxxxxxxxxxxxxxx', status:'Andamento', tipo:'Buraco na via', prazo:'5 dias', prioridade:'Alta', prazoType:'ok' },
  { id:6, protocolo:'#xxxxxxxxxx', endereco:'xxxxxxxxxxxxxxxxxxxxxx', status:'Em campo', tipo:'Calçada danificada', prazo:'15 dias', prioridade:'Média', prazoType:'ok' },
];

const STATUS_STYLE = {
  'Andamento': '#2F80ED',
  'Em campo': '#27AE60',
  'Resolvido': '#6FCF97',
  'Triagem':   '#F2994A',
  'Urgente':   '#EB5757',
};
const PRIO_STYLE = {
  'Alta':    { bg: '#EB5757', color: '#fff' },
  'Média':   { bg: '#F2C94C', color: '#333' },
  'Baixa':   { bg: '#27AE60', color: '#fff' },
  'Urgente': { bg: '#EB5757', color: '#fff' },
};

export default function Solicitacoes() {
  const [items, setItems] = useState(MOCK);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    ocorrenciaService.listar().then(r => { if(r.data?.length) setItems(r.data); }).catch(()=>{});
  }, []);

  const filtered = items.filter(it =>
    !search || it.protocolo.toLowerCase().includes(search.toLowerCase()) || it.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <h1 className={styles.title}>Gestão de Solicitações</h1>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon}/>
          <input className={styles.searchInput} placeholder="Buscar protocolo..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <button className={styles.newBtn}>+ Novo</button>
      </div>

      <div className={styles.tableCard}>
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
            {filtered.map((row, i) => (
              <tr key={i}>
                <td className={styles.proto}>{row.protocolo}</td>
                <td className={styles.muted}>{row.endereco}</td>
                <td>
                  <span style={{
                    background: STATUS_STYLE[row.status] || '#999',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>{row.status}</span>
                </td>
                <td>{row.tipo}</td>
                <td className={[styles.prazo, row.prazoType==='urgent' ? styles.urgent : ''].join(' ')}>{row.prazo}</td>
                <td>
                  <span style={{
                    background: PRIO_STYLE[row.prioridade]?.bg,
                    color: PRIO_STYLE[row.prioridade]?.color,
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-block'
                  }}>{row.prioridade}</span>
                </td>
                <td><button className={styles.viewBtn}>Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className={styles.empty}>Nenhuma solicitação encontrada.</p>}

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
    </AdminLayout>
  );
}

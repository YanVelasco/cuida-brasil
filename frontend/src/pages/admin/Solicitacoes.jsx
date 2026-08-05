import { useState, useEffect, useCallback } from 'react';
import { ocorrenciaService } from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search, RefreshCw } from 'lucide-react';
import styles from './Solicitacoes.module.css';

const STATUS_STYLE = {
  'PENDENTE':     { label: 'Pendente',     color: '#F2994A' },
  'TRIAGEM':      { label: 'Triagem',      color: '#9B51E0' },
  'EM_ANDAMENTO': { label: 'Em Andamento', color: '#2F80ED' },
  'EM_CAMPO':     { label: 'Em Campo',     color: '#27AE60' },
  'CONCLUIDA':    { label: 'Concluída',    color: '#6FCF97' },
  'CANCELADA':    { label: 'Cancelada',    color: '#EB5757' },
};

const PRIO_STYLE = {
  'ALTA':    { bg: '#EB5757', color: '#fff' },
  'MEDIA':   { bg: '#F2C94C', color: '#333' },
  'BAIXA':   { bg: '#27AE60', color: '#fff' },
  'URGENTE': { bg: '#EB5757', color: '#fff' },
};

const PAGE_SIZE = 10;

export default function Solicitacoes() {
  const [items, setItems]         = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(1);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', prioridade: '' });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { page, size: PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;

    ocorrenciaService.listar(params)
      .then(r => {
        const pageData = r.data?.data || r.data || {};
        setItems(pageData.content || []);
        setTotal(pageData.totalPages || 1);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenUpdate = (row) => {
    setSelectedSolicitacao(row);
    setUpdateData({ 
      status: row.status || 'PENDENTE', 
      prioridade: row.prioridade || 'BAIXA' 
    });
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      await ocorrenciaService.atualizarStatus(selectedSolicitacao.id, updateData);
      alert('Solicitação atualizada com sucesso!');
      setShowUpdateModal(false);
      fetchData();
    } catch (err) {
      alert('Erro ao atualizar solicitação: ' + (err.response?.data?.message || err.message));
    }
  };

  const filtered = search
    ? items.filter(it =>
        it.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        it.categoriaServico?.toLowerCase().includes(search.toLowerCase()) ||
        it.subcategoriaServico?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  return (
    <AdminLayout>
      <h1 className={styles.title}>Gestão de Solicitações</h1>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon}/>
          <input
            className={styles.searchInput}
            placeholder="Buscar protocolo ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.pageSizeSelect}
          value={statusFilter}
          onChange={e => { setStatus(e.target.value); setPage(0); }}
          style={{ marginLeft: 8 }}
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="TRIAGEM">Triagem</option>
          <option value="EM_ANDAMENTO">Em Andamento</option>
          <option value="EM_CAMPO">Em Campo</option>
          <option value="CONCLUIDA">Concluída</option>
          <option value="CANCELADA">Cancelada</option>
        </select>

        <button className={styles.newBtn} onClick={fetchData} title="Recarregar">
          <RefreshCw size={14}/> Atualizar
        </button>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <p style={{ padding: '24px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Carregando solicitações...
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>PROTOCOLO</th>
                  <th>CIDADÃO</th>
                  <th>STATUS</th>
                  <th>TIPO DE SERVIÇO</th>
                  <th>LOCALIZAÇÃO</th>
                  <th>PRIORIDADE</th>
                  <th>DATA</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const st = STATUS_STYLE[row.status] || { label: row.status, color: '#999' };
                  const pr = PRIO_STYLE[row.prioridade] || { bg: '#e5e7eb', color: '#333' };
                  const data = row.dataCriacao
                    ? new Date(row.dataCriacao).toLocaleDateString('pt-BR')
                    : '—';
                  return (
                    <tr key={row.id || i}>
                      <td className={styles.proto}>{row.protocolo}</td>
                      <td className={styles.muted}>{row.nomeUsuario || '—'}</td>
                      <td>
                        <span style={{
                          background: st.color,
                          color: '#fff',
                          padding: '3px 10px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}>{st.label}</span>
                      </td>
                      <td>{row.categoriaServico}<br/><small style={{color:'var(--text-secondary)'}}>{row.subcategoriaServico}</small></td>
                      <td className={styles.muted} style={{fontSize:'0.8rem'}}>{row.gps || '—'}</td>
                      <td>
                        {row.prioridade ? (
                          <span style={{
                            background: pr.bg,
                            color: pr.color,
                            padding: '3px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}>{row.prioridade}</span>
                        ) : <span style={{color:'var(--text-secondary)'}}>—</span>}
                      </td>
                      <td style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{data}</td>
                      <td>
                        <button 
                          className={styles.newBtn} 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                          onClick={() => handleOpenUpdate(row)}
                        >
                          Atualizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className={styles.empty}>Nenhuma solicitação encontrada.</p>
        )}

        {/* Paginação real */}
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >‹</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
            <button
              key={i}
              className={[styles.pageBtn, page === i ? styles.pageActive : ''].join(' ')}
              onClick={() => setPage(i)}
            >{i + 1}</button>
          ))}
          {totalPages > 5 && <span style={{padding:'0 8px',color:'var(--text-secondary)'}}>...</span>}
          <button
            className={styles.pageBtn}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >›</button>
          <span style={{ marginLeft: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Página {page + 1} de {totalPages}
          </span>
        </div>
      </div>

      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className={styles.modalOverlay} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className={styles.modalContent} style={{ background: 'var(--surface)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '400px', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Atualizar Solicitação</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{selectedSolicitacao?.protocolo} - {selectedSolicitacao?.categoriaServico}</p>
            
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Status</label>
            <select 
              value={updateData.status} 
              onChange={e => setUpdateData({...updateData, status: e.target.value})} 
              style={{ width: '100%', padding: '8px', marginBottom: '16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
            >
              <option value="PENDENTE">Pendente</option>
              <option value="TRIAGEM">Triagem</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="EM_CAMPO">Em Campo</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Prioridade</label>
            <select 
              value={updateData.prioridade} 
              onChange={e => setUpdateData({...updateData, prioridade: e.target.value})} 
              style={{ width: '100%', padding: '8px', marginBottom: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowUpdateModal(false)} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleUpdateSubmit} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

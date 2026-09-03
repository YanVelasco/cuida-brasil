import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ocorrenciaService, equipeService } from '../../services/api';
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
  const location = useLocation();
  const [items, setItems]         = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(1);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [gestorFilter, setGestorFilter] = useState('');
  const [gestores, setGestores] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState('');
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', prioridade: '', idEquipe: null });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { page, size: PAGE_SIZE };
    if (statusFilter) params.status = statusFilter;
    if (gestorFilter) params.gestor = gestorFilter;

    ocorrenciaService.listar(params)
      .then(r => {
        const pageData = r.data?.data || r.data || {};
        setItems(pageData.content || []);
        setTotal(pageData.totalPages || 1);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [page, statusFilter, gestorFilter]);

  const loadEquipes = useCallback(async () => {
    try {
      const [listarResponse, dashboardResponse] = await Promise.allSettled([
        equipeService.listar(),
        equipeService.dashboard({ page: 0, size: 200 })
      ]);

      const rawItems = [];

      if (listarResponse.status === 'fulfilled') {
        const listData = listarResponse.value.data?.data || listarResponse.value.data || [];
        const listArray = Array.isArray(listData) ? listData : (listData.content || []);
        rawItems.push(...listArray);
      }

      if (dashboardResponse.status === 'fulfilled') {
        const dashboardData = dashboardResponse.value.data?.data || dashboardResponse.value.data || {};
        const dashboardArray = Array.isArray(dashboardData) ? dashboardData : (dashboardData.content || []);
        rawItems.push(...dashboardArray);
        setGestores([...new Set(dashboardArray.map((item) => item.supervisor).filter((nome) => nome && nome !== 'Sem supervisor'))].sort());
      }

      const nextEquipes = rawItems.filter((item, index, arr) => {
        const id = String(item.id ?? '');
        const nome = String(item.nome ?? '');
        return arr.findIndex((entry) => String(entry.id ?? '') === id || String(entry.nome ?? '') === nome) === index;
      });

      setEquipes(nextEquipes);
      return nextEquipes;
    } catch (error) {
      setEquipes([]);
      return [];
    }
  }, []);

  useEffect(() => {
    loadEquipes();
  }, [loadEquipes]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const targetId = location.state?.selectedIncidentId;
    if (!targetId || !items.length) return;

    const match = items.find((item) => String(item.id) === String(targetId));
    if (match) {
      handleOpenUpdate(match);
    }
  }, [items, location.state]);

  const handleOpenUpdate = async (row) => {
    const availableEquipes = await loadEquipes();
    const equipeAtual = availableEquipes.find((equipe) =>
      equipe.nome === row.nomeEquipe ||
      equipe.nome === row.equipe?.nome ||
      String(equipe.id) === String(row.idEquipe) ||
      String(equipe.id) === String(row.equipeId)
    );

    setSelectedSolicitacao(row);
    setSelectedEquipeId(equipeAtual ? String(equipeAtual.id) : '');
    setUpdateData({ 
      status: row.status || 'PENDENTE', 
      prioridade: row.prioridade || 'BAIXA',
      idEquipe: equipeAtual ? Number(equipeAtual.id) : null,
    });
    setShowUpdateModal(true);
  };

  useEffect(() => {
    if (!selectedSolicitacao || !equipes.length) return;

    const equipeAtual = equipes.find((equipe) =>
      equipe.nome === selectedSolicitacao.nomeEquipe ||
      equipe.nome === selectedSolicitacao.equipe?.nome ||
      String(equipe.id) === String(selectedSolicitacao.idEquipe) ||
      String(equipe.id) === String(selectedSolicitacao.equipeId)
    );
    const equipeId = equipeAtual ? String(equipeAtual.id) : '';

    setSelectedEquipeId((current) => current || equipeId);
    setUpdateData((current) => ({
      ...current,
      idEquipe: equipeAtual ? Number(equipeAtual.id) : current.idEquipe,
    }));
  }, [selectedSolicitacao, equipes]);

  const handleUpdateSubmit = async () => {
    try {
      const payload = {
        ...updateData,
        idEquipe: selectedEquipeId ? Number(selectedEquipeId) : null,
      };

      await ocorrenciaService.atualizarStatus(selectedSolicitacao.id, payload);

      const equipeSelecionada = equipes.find((equipe) => String(equipe.id) === String(selectedEquipeId));
      setItems((current) =>
        current.map((item) =>
          item.id === selectedSolicitacao.id
            ? {
                ...item,
                status: payload.status,
                prioridade: payload.prioridade,
                nomeEquipe: equipeSelecionada?.nome || null,
              }
            : item
        )
      );

      alert('Solicitação atualizada com sucesso!');
      setShowUpdateModal(false);
      setSelectedSolicitacao(null);
      setSelectedEquipeId('');
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

        <select
          className={styles.pageSizeSelect}
          value={gestorFilter}
          onChange={e => { setGestorFilter(e.target.value); setPage(0); }}
        >
          <option value="">Todos os gestores</option>
          {gestores.map((gestor) => <option key={gestor} value={gestor}>{gestor}</option>)}
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
              style={{ width: '100%', padding: '8px', marginBottom: '16px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
            >
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>

            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Equipe</label>
            {selectedSolicitacao?.nomeEquipe && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Equipe atual: {selectedSolicitacao.nomeEquipe}
              </div>
            )}
            <select
              value={selectedEquipeId}
              onChange={(e) => {
                const nextValue = e.target.value;
                setSelectedEquipeId(nextValue);
                setUpdateData((current) => ({ ...current, idEquipe: nextValue ? Number(nextValue) : null }));
              }}
              style={{ width: '100%', padding: '8px', marginBottom: '24px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)' }}
            >
              <option value="">Sem equipe</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={String(equipe.id)}>{equipe.nome}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowUpdateModal(false); setSelectedSolicitacao(null); setSelectedEquipeId(''); }} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleUpdateSubmit} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

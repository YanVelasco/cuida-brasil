import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { ocorrenciaService, equipeService, anexoService, usuarioService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRegion } from '../../contexts/RegionContext';
import { resolveRegionFromGps } from '../../utils/geo';
import useEnderecos from '../../hooks/useEnderecos';
import AdminLayout from '../../components/layout/AdminLayout';
import { Search, RefreshCw, Trash2, Camera, Download } from 'lucide-react';
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
  const { user } = useAuth();
  const { selectedRegion } = useRegion();
  const isAdmin = user?.perfil === 'ADMIN';
  const isGestor = user?.perfil === 'GESTOR';
  const [items, setItems]         = useState([]);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(0);
  const [totalPages, setTotal]    = useState(1);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('');
  const [gestorFilter, setGestorFilter] = useState('');
  const [gestores, setGestores] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [selectedEquipeId, setSelectedEquipeId] = useState('');
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', prioridade: '', idEquipe: null });
  const [showFotosModal, setShowFotosModal] = useState(false);
  const [fotosSolicitacao, setFotosSolicitacao] = useState(null);
  const [fotos, setFotos] = useState([]);
  const [fotosLoading, setFotosLoading] = useState(false);
  const [cidadaos, setCidadaos] = useState([]);
  const [cidadaosLoading, setCidadaosLoading] = useState(true);
  const [usuariosComuns, setUsuariosComuns] = useState([]);
  const [usuariosLoading, setUsuariosLoading] = useState(true);
  const enderecos = useEnderecos(items);

  useEffect(() => {
    let ativo = true;
    usuarioService.listarCidadaos()
      .then((resp) => { if (ativo) setUsuariosComuns(resp.data?.data || []); })
      .catch((err) => console.error('Erro ao carregar usuários comuns:', err))
      .finally(() => { if (ativo) setUsuariosLoading(false); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    let ativo = true;
    ocorrenciaService.cidadaos()
      .then((resp) => { if (ativo) setCidadaos(resp.data?.data || []); })
      .catch((err) => console.error('Erro ao carregar cidadãos:', err))
      .finally(() => { if (ativo) setCidadaosLoading(false); });
    return () => { ativo = false; };
  }, []);

  const EXTENSOES_IMAGEM = /\.(jpe?g|png|gif|bmp|webp|heic)$/i;

  const handleVerFotos = async (row) => {
    setFotosSolicitacao(row);
    setShowFotosModal(true);
    setFotosLoading(true);
    setFotos([]);
    try {
      let carregados = [];
      try {
        const resp = await anexoService.listar(row.id);
        const anexos = resp.data?.data || [];
        carregados = await Promise.all(anexos.map(async (anexo) => {
          const ehImagem = EXTENSOES_IMAGEM.test(anexo.arquivo || '');
          let url = null;
          if (ehImagem) {
            try {
              const blobResp = await anexoService.download(anexo.id);
              url = URL.createObjectURL(blobResp.data);
            } catch { /* mantém sem preview */ }
          }
          return { ...anexo, ehImagem, url };
        }));
      } catch {
        carregados = [];
      }

      if (carregados.length === 0 && row.fotos) {
        const fotoBase64 = String(row.fotos).trim();
        if (fotoBase64.startsWith('data:image') || fotoBase64.startsWith('http')) {
          carregados = [{
            id: `foto-${row.id}`,
            arquivo: 'foto-da-solicitacao.jpg',
            ehImagem: true,
            url: fotoBase64,
          }];
        }
      }

      setFotos(carregados);
    } catch (err) {
      alert('Erro ao carregar anexos: ' + (err.response?.data?.message || err.message));
    } finally {
      setFotosLoading(false);
    }
  };

  const handleFecharFotos = () => {
    fotos.forEach((f) => { if (f.url) URL.revokeObjectURL(f.url); });
    setFotos([]);
    setFotosSolicitacao(null);
    setShowFotosModal(false);
  };

  const handleBaixarAnexo = async (anexo) => {
    try {
      if (anexo.url && String(anexo.id).startsWith('foto-')) {
        const a = document.createElement('a');
        a.href = anexo.url;
        a.download = anexo.arquivo || 'foto-da-solicitacao.jpg';
        a.click();
        return;
      }
      const blobResp = await anexoService.download(anexo.id);
      const url = URL.createObjectURL(blobResp.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.arquivo || `anexo-${anexo.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Erro ao baixar anexo: ' + (err.response?.data?.message || err.message));
    }
  };

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

  const handleDelete = async (row) => {
    if (!window.confirm(`Excluir a solicitação ${row.protocolo}? Esta ação não pode ser desfeita e ficará registrada na auditoria.`)) return;
    try {
      await ocorrenciaService.excluir(row.id);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao excluir solicitação.');
    }
  };

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

  const filtered = items.filter(it => {
    const matchesSearch = !search ||
        it.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
        it.categoriaServico?.toLowerCase().includes(search.toLowerCase()) ||
        it.subcategoriaServico?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch &&
      (!categoriaFilter || it.categoriaServico === categoriaFilter) &&
      (!prioridadeFilter || (it.prioridade || '').toUpperCase() === prioridadeFilter) &&
      (!selectedRegion || resolveRegionFromGps(it.gps) === selectedRegion);
  });

  const categorias = [...new Set(items.map((item) => item.categoriaServico).filter(Boolean))].sort();

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
          value={categoriaFilter}
          onChange={e => { setCategoriaFilter(e.target.value); setPage(0); }}
        >
          <option value="">Todos os tipos</option>
          {categorias.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
        </select>

        <select
          className={styles.pageSizeSelect}
          value={prioridadeFilter}
          onChange={e => { setPrioridadeFilter(e.target.value); setPage(0); }}
        >
          <option value="">Todas as prioridades</option>
          <option value="URGENTE">Urgente</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>

        {(search || statusFilter || gestorFilter || categoriaFilter || prioridadeFilter) && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setStatus(''); setGestorFilter(''); setCategoriaFilter(''); setPrioridadeFilter(''); setPage(0); }}>
            Limpar filtros
          </button>
        )}

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
                      <td className={styles.muted} style={{fontSize:'0.8rem', maxWidth: 220}} title={row.gps || ''}>
                        {row.endereco || enderecos[row.gps] || row.gps || '—'}
                      </td>
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
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            title="Ver fotos do problema"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleVerFotos(row)}
                          >
                            <Camera size={14}/> Fotos
                          </button>
                          {isGestor && (
                            <button 
                              className={styles.newBtn} 
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                              onClick={() => handleOpenUpdate(row)}
                            >
                              Atualizar
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              title="Excluir solicitação"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', background: '#EB5757', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                              onClick={() => handleDelete(row)}
                            >
                              <Trash2 size={14}/>
                            </button>
                          )}
                        </div>
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

      {/* Cidadãos com problemas atribuídos a gestores */}
      <div className={styles.tableCard} style={{ marginTop: '20px' }}>
        <div style={{ padding: '14px 16px 0' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {isGestor ? 'Cidadãos com problemas atribuídos à sua equipe' : 'Cidadãos com problemas atribuídos a gestores'}
          </h3>
          <p style={{ margin: '4px 0 10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {isGestor
              ? 'Usuários cujas solicitações estão sob responsabilidade da sua equipe'
              : 'Todos os usuários cujas solicitações foram atribuídas a um gestor'}
            {!cidadaosLoading && ` — ${cidadaos.length} registro(s)`}
          </p>
        </div>
        {cidadaosLoading ? (
          <p className={styles.empty}>Carregando…</p>
        ) : cidadaos.length === 0 ? (
          <p className={styles.empty}>Nenhum cidadão com problema atribuído a gestor.</p>
        ) : (
          <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CIDADÃO</th><th>E-MAIL</th><th>PROTOCOLO</th><th>SERVIÇO</th>
                  {isAdmin && <th>GESTOR RESPONSÁVEL</th>}
                  <th>EQUIPE</th><th>STATUS</th><th>DATA</th>
                </tr>
              </thead>
              <tbody>
                {cidadaos.map((c) => {
                  const st = STATUS_STYLE[c.status] || { label: c.status, color: '#828282' };
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.cidadaoNome}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.cidadaoEmail || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.protocolo}</td>
                      <td>{c.categoria}{c.subcategoria ? ` · ${c.subcategoria}` : ''}</td>
                      {isAdmin && <td>{c.gestorNome}</td>}
                      <td>{c.equipeNome}</td>
                      <td><span style={{ background: st.color, color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600 }}>{st.label}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.dataCriacao ? new Date(c.dataCriacao).toLocaleDateString('pt-BR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usuários comuns: ADMIN vê todos; GESTOR vê os atrelados à sua equipe */}
      {(isAdmin || isGestor) && (
        <div className={styles.tableCard} style={{ marginTop: '20px' }}>
          <div style={{ padding: '14px 16px 0' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {isGestor ? 'Usuários atrelados a você' : 'Usuários Comuns (Cidadãos)'}
            </h3>
            <p style={{ margin: '4px 0 10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isGestor
                ? 'Cidadãos com solicitações atribuídas à sua equipe'
                : 'Todos os cidadãos cadastrados na plataforma'}
              {!usuariosLoading && ` — ${usuariosComuns.length} usuário(s)`}
            </p>
          </div>
          {usuariosLoading ? (
            <p className={styles.empty}>Carregando…</p>
          ) : usuariosComuns.length === 0 ? (
            <p className={styles.empty}>{isGestor ? 'Nenhum usuário atrelado à sua equipe.' : 'Nenhum usuário comum cadastrado.'}</p>
          ) : (
            <div className={styles.tableWrapper} style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th><th>NOME</th><th>E-MAIL</th><th>CPF</th><th>SOLICITAÇÕES</th><th>SITUAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosComuns.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>USR-{String(u.id).padStart(3, '0')}</td>
                      <td style={{ fontWeight: 600 }}>{u.nome}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{u.cpf || '—'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{u.totalSolicitacoes}</td>
                      <td>
                        <span style={{ background: u.ativo ? '#27AE60' : '#828282', color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600 }}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* UPDATE MODAL */}
      {showUpdateModal && (
        <div className={styles.modalOverlay} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className={styles.modalContent} style={{ background: 'var(--surface)', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '620px', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '4px', color: 'var(--text-primary)' }}>Detalhe da Ocorrência</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px' }}>
              {selectedSolicitacao?.protocolo} · registrada por {selectedSolicitacao?.nomeUsuario || 'cidadão'}
            </p>

            <div style={{ padding: '14px', marginBottom: '18px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--background)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 18px', fontSize: '0.82rem' }}>
                <div><strong>Tipo de serviço</strong><br />{selectedSolicitacao?.categoriaServico || '—'}{selectedSolicitacao?.subcategoriaServico ? ` · ${selectedSolicitacao.subcategoriaServico}` : ''}</div>
                <div><strong>Data de abertura</strong><br />{selectedSolicitacao?.dataCriacao ? new Date(selectedSolicitacao.dataCriacao).toLocaleString('pt-BR') : '—'}</div>
                <div><strong>Localização</strong><br />{selectedSolicitacao?.endereco || enderecos[selectedSolicitacao?.gps] || selectedSolicitacao?.gps || 'Não informada'}</div>
                <div><strong>Equipe atual</strong><br />{selectedSolicitacao?.nomeEquipe || 'Sem equipe atribuída'}</div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <strong style={{ fontSize: '0.82rem' }}>O que o cidadão escreveu</strong>
                <div style={{ marginTop: '6px', padding: '10px', borderLeft: '3px solid var(--primary)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {selectedSolicitacao?.descricao || 'Descrição não informada.'}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Atualizar atendimento</div>
            
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
              disabled={!isGestor}
              onChange={(e) => {
                const nextValue = e.target.value;
                setSelectedEquipeId(nextValue);
                setUpdateData((current) => ({ ...current, idEquipe: nextValue ? Number(nextValue) : null }));
              }}
              style={{ width: '100%', padding: '8px', marginBottom: isGestor ? '24px' : '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', opacity: isGestor ? 1 : 0.6 }}
            >
              <option value="">Sem equipe</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={String(equipe.id)}>{equipe.nome}</option>
              ))}
            </select>
            {!isGestor && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Apenas gestores podem atribuir incidentes a uma equipe.
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowUpdateModal(false); setSelectedSolicitacao(null); setSelectedEquipeId(''); }} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleUpdateSubmit} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showFotosModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={handleFecharFotos}>
          <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '24px', width: '640px', maxWidth: '92vw', maxHeight: '85vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Fotos do problema</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{fotosSolicitacao?.protocolo}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {fotosSolicitacao?.categoriaServico || ''}{fotosSolicitacao?.subcategoriaServico ? ` · ${fotosSolicitacao.subcategoriaServico}` : ''}
            </div>

            {fotosLoading && (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando anexos…</div>
            )}

            {!fotosLoading && fotos.length === 0 && (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '6px' }}>
                O cidadão não enviou fotos para esta solicitação.
              </div>
            )}

            {!fotosLoading && fotos.some((f) => f.ehImagem) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                {fotos.filter((f) => f.ehImagem).map((f) => (
                  <figure key={f.id} style={{ margin: 0, border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'var(--background)' }}>
                    {f.url ? (
                      <img
                        src={f.url}
                        alt={f.arquivo}
                        style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
                        onClick={() => window.open(f.url, '_blank')}
                        title="Clique para ampliar"
                      />
                    ) : (
                      <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Falha ao carregar</div>
                    )}
                    <figcaption style={{ padding: '6px 8px', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.arquivo}</span>
                      <button title="Baixar" onClick={() => handleBaixarAnexo(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex' }}><Download size={14}/></button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {!fotosLoading && fotos.some((f) => !f.ehImagem) && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Outros anexos</div>
                {fotos.filter((f) => !f.ehImagem).map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '6px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    <span>{f.arquivo}</span>
                    <button title="Baixar" onClick={() => handleBaixarAnexo(f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex' }}><Download size={14}/></button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleFecharFotos} style={{ padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

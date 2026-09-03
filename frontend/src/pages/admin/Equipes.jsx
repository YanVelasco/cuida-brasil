import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { equipeService, orgaoService, ocorrenciaService } from '../../services/api';
import { MapPin, CheckCircle, Shield } from 'lucide-react';
import styles from './Equipes.module.css';

const PAGE_SIZE = 10;

export default function Equipes() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.perfil === 'ADMIN';
  const [search, setSearch] = useState('');
  
  // Equipes Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [equipes, setEquipes] = useState([]);
  const [kpis, setKpis] = useState([]);
  
  // Membros Modal & Pagination
  const [showMembrosModal, setShowMembrosModal] = useState(false);
  const [membrosEquipe, setMembrosEquipe] = useState([]);
  const [membrosPage, setMembrosPage] = useState(0);
  const [membrosTotalPages, setMembrosTotalPages] = useState(1);
  const [viewingEquipeId, setViewingEquipeId] = useState(null);

  // Map Hover
  const [hoverInfo, setHoverInfo] = useState(null);

  // Modals state
  const [showNewEquipeModal, setShowNewEquipeModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEquipeId, setSelectedEquipeId] = useState(null);

  // Forms state
  const [newEquipeData, setNewEquipeData] = useState({ nome: '', idOrgao: '' });
  const [newMemberData, setNewMemberData] = useState({ nome: '', cpf: '', email: '', senha: '', perfil: 'TRABALHADOR' });
  const [orgaos, setOrgaos] = useState([]);
  
  // Unassigned incidents state
  const [unassignedIncidents, setUnassignedIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);

  const carregarDados = useCallback(async () => {
    try {
      const resp = await equipeService.dashboard({ page, size: PAGE_SIZE });
      const data = resp.data.data;
      const equipesVisiveis = user?.perfil === 'GESTOR'
        ? data.content.filter((equipe) => equipe.supervisor === user.nome)
        : data.content;
      setEquipes(equipesVisiveis);
      setTotalPages(user?.perfil === 'GESTOR' ? (equipesVisiveis.length ? 1 : 0) : (data.totalPages || 1));

      // KPI cards only reflect the current page due to pagination (unless we do a separate count, but let's use the page for now)
      const emCampo = equipesVisiveis.filter(e => e.status === 'Em campo').length;
      const sobrecarr = equipesVisiveis.filter(e => e.status === 'Sobrecarr.').length;
      const disp = equipesVisiveis.filter(e => e.status === 'Disponível').length;

      setKpis([
        { label:'EQUIPES NA TELA', value:equipesVisiveis.length, sub:`Página ${page+1}`, color:'blue' },
        { label:'EM CAMPO', value:emCampo, sub:`Nesta página`, color:'green' },
        { label:'DISPONÍVEL', value:disp, sub:`Nesta página`, color:'gray' },
        { label:'SOBRECARREGADAS', value:sobrecarr, sub:`Nesta página`, color:'red' },
      ]);
    } catch(err) {
      console.error("Erro ao carregar equipes:", err);
    }
  }, [page, user?.nome, user?.perfil]);

  useEffect(() => {
    carregarDados();
    async function loadOrgaos() {
      try {
        const response = await orgaoService.listar();
        setOrgaos(response.data.data);
      } catch (err) {
        console.error("Erro ao carregar orgãos:", err);
      }
    }
    loadOrgaos();
  }, [carregarDados]);

  const carregarMembros = async (equipeId, pageNum = 0) => {
    try {
      const resp = await equipeService.listarMembros(equipeId, { page: pageNum, size: PAGE_SIZE });
      setMembrosEquipe(resp.data.data.content);
      setMembrosTotalPages(resp.data.data.totalPages || 1);
      setMembrosPage(pageNum);
      setViewingEquipeId(equipeId);
      setShowMembrosModal(true);
    } catch (err) {
      alert("Erro ao buscar membros.");
    }
  };

  const handleCreateEquipe = async () => {
    if (!newEquipeData.idOrgao || !newEquipeData.nome) return alert('Preencha os campos.');
    try {
      await equipeService.criar({ ...newEquipeData, idOrgao: Number(newEquipeData.idOrgao) });
      alert('Equipe criada com sucesso!');
      setShowNewEquipeModal(false);
      carregarDados();
    } catch (err) {
      alert('Erro ao criar equipe. ' + (err.response?.data?.message || ''));
    }
  };

  const handleAddMember = async () => {
    if (!selectedEquipeId || !newMemberData.nome || !newMemberData.cpf || !newMemberData.email || !newMemberData.senha) {
      return alert('Preencha todos os dados do membro.');
    }

    try {
      const equipeId = Number(selectedEquipeId);
      await equipeService.adicionarMembro(equipeId, newMemberData);
      alert('Membro adicionado com sucesso!');
      setShowNewMemberModal(false);
      setNewMemberData({ nome: '', cpf: '', email: '', senha: '', perfil: 'TRABALHADOR' });
      carregarDados();
      await carregarMembros(equipeId, 0);
    } catch (err) {
      alert('Erro ao adicionar membro. ' + (err.response?.data?.message || ''));
    }
  };

  const handleOpenAssignModal = async (equipeId, selectedIncident = null) => {
    setSelectedEquipeId(equipeId);
    try {
      const resp = await ocorrenciaService.listar({ page: 0, size: 200 });
      const items = resp.data?.data?.content || resp.data?.content || [];
      const activeIncidents = items.filter((inc) => !['CONCLUIDA', 'CANCELADA'].includes((inc.status || '').toUpperCase()));
      const incidentList = selectedIncident
        ? activeIncidents.filter((inc) => String(inc.id) === String(selectedIncident))
        : activeIncidents;

      setUnassignedIncidents(incidentList);
      setSelectedIncidentDetail(incidentList[0] || null);
      setSelectedIncidentId(selectedIncident ? String(selectedIncident) : '');
      setShowAssignModal(true);
    } catch (err) {
      alert('Erro ao buscar incidentes para atribuição.');
    }
  };

  useEffect(() => {
    const selectedIncidentIdFromState = location.state?.selectedIncidentId;
    if (!selectedIncidentIdFromState) return;

    setSelectedIncidentId(String(selectedIncidentIdFromState));
    setShowAssignModal(true);
    setSelectedEquipeId(null);

    ocorrenciaService.listar({ page: 0, size: 200 })
      .then((resp) => {
        const items = resp.data?.data?.content || resp.data?.content || [];
        const activeIncidents = items.filter((inc) => !['CONCLUIDA', 'CANCELADA'].includes((inc.status || '').toUpperCase()));
        const match = activeIncidents.find((inc) => String(inc.id) === String(selectedIncidentIdFromState));

        setSelectedIncidentDetail(match || null);
        setUnassignedIncidents(match ? [match] : []);
      })
      .catch(() => {
        setSelectedIncidentDetail(null);
        setUnassignedIncidents([]);
      });
  }, [location.state]);

  useEffect(() => {
    if (!selectedIncidentDetail?.nomeEquipe) {
      return;
    }

    const matchingEquipe = equipes.find((equipe) => equipe.nome === selectedIncidentDetail.nomeEquipe);
    if (matchingEquipe) {
      setSelectedEquipeId(String(matchingEquipe.id));
    }
  }, [selectedIncidentDetail, equipes]);

  const handleAssignIncident = async () => {
    if (!selectedIncidentId) return alert('Selecione um incidente.');
    if (!selectedEquipeId) return alert('Selecione uma equipe antes de atribuir.');

    try {
      await ocorrenciaService.atualizarStatus(selectedIncidentId, { 
        status: 'TRIAGEM', 
        idEquipe: Number(selectedEquipeId), 
        comentario: 'Atribuído à equipe pelo painel.' 
      });
      alert('Incidente atribuído com sucesso!');
      setShowAssignModal(false);
      setSelectedIncidentId('');
      setSelectedEquipeId(null);
      setSelectedIncidentDetail(null);
      carregarDados(); 
    } catch (err) {
      alert('Erro ao atribuir incidente.');
    }
  };

  const handleDistrictHover = (name, stats) => {
    setHoverInfo({ type: 'district', title: name, details: stats });
  };

  const handlePinHover = (team) => {
    setHoverInfo({
      type: 'team', title: team.nome, status: team.status, supervisor: team.supervisor,
      tipo: team.tipoServico, casos: team.casosAbertos, sla: team.slaMedio
    });
  };

  const handleMouseLeave = () => setHoverInfo(null);

  const filteredEquipes = search ? equipes.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase()) || 
    (e.supervisor && e.supervisor.toLowerCase().includes(search.toLowerCase()))
  ) : equipes;

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Gestão de Equipes</h1>
        {isAdmin && <button className={styles.newBtn} onClick={() => setShowNewEquipeModal(true)}>+ Nova Equipe</button>}
      </div>

      <div className={styles.filterBar}>
        <input className={styles.searchInput} placeholder="Buscar equipe ou supervisor..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <button className={styles.clearBtn} onClick={() => setSearch('')}>🗑 Limpar busca</button>
      </div>

      {/* KPI Cards */}
      <div className={styles.kpis}>
        {kpis.map((k,i) => (
          <div key={i} className={[styles.kpiCard, styles[k.color]].join(' ')}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiVal}>{k.value}</div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th><th>EQUIPE</th><th>SUPERVISOR</th><th>Membros</th>
                <th>TIPO DE SERVIÇO</th><th>REGIÃO / ÁREA</th><th>CASOS ABERTOS</th>
                <th>STATUS</th><th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipes.map((e,i) => (
                <tr key={e.id}>
                  <td className={styles.id}>EQP-{e.id.toString().padStart(2, '0')}</td>
                  <td className={styles.teamName}>{e.nome}</td>
                  <td className={styles.muted}>{e.supervisor}</td>
                  <td>
                    <button className={styles.viewBtn} onClick={() => carregarMembros(e.id, 0)}>Ver ({e.tecnicos})</button>
                  </td>
                  <td>{e.tipoServico}</td>
                  <td>{e.regiao}</td>
                  <td className={styles.center} style={{color: e.casosAbertos > 15 ? 'var(--danger)' : 'inherit', fontWeight: e.casosAbertos > 15 ? 700 : 400}}>
                    {e.casosAbertos}
                  </td>
                  <td>
                    <span className={styles.statusBadge} style={{background: e.statusColor}}>{e.status}</span>
                  </td>
                  <td>
                    <div style={{display:'flex', gap:'5px'}}>
                      <button className={styles.actionBtnPurple} onClick={() => handleOpenAssignModal(e.id)}>+ Incidente</button>
                      <button className={styles.actionBtnBlue} onClick={() => { setSelectedEquipeId(e.id); setShowNewMemberModal(true); }}>+ Membro</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEquipes.length === 0 && (
                <tr><td colSpan="9" style={{textAlign:'center', padding:'20px'}}>Nenhuma equipe encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Página {page + 1} de {totalPages}</span>
          <button className={styles.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</button>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomGrid}>
        <div className={styles.mapCard}>
          <div className={styles.mapCardHeader}>
            <h3>Mapa de Alocação (Visão Geral)</h3>
          </div>
          <div className={styles.mapContainer}>
            {hoverInfo && (
              <div className={styles.mapTooltip}>
                {hoverInfo.type === 'district' ? (
                  <>
                    <strong style={{fontSize:'0.78rem', display:'block', marginBottom:'2px', color:'var(--primary)'}}>{hoverInfo.title}</strong>
                    <div>{hoverInfo.details}</div>
                  </>
                ) : (
                  <>
                    <strong style={{fontSize:'0.78rem', display:'block', color: hoverInfo.status === 'Sobrecarr.' ? '#EB5757' : 'var(--primary)'}}>{hoverInfo.title}</strong>
                    <div style={{fontSize:'0.65rem', color:'var(--text-muted)', marginBottom:'4px'}}>{hoverInfo.tipo}</div>
                    <div style={{marginTop:'4px'}}>• Supervisor: <strong>{hoverInfo.supervisor}</strong></div>
                    <div>• Casos: <strong>{hoverInfo.casos}</strong></div>
                    <div style={{marginTop:'4px', display:'flex', alignItems:'center', gap:'4px'}}>
                      <span style={{
                        width:'6px', height:'6px', borderRadius:'50%', 
                        background: hoverInfo.status === 'Sobrecarr.' ? '#EB5757' : hoverInfo.status === 'Disponível' ? '#F2C94C' : '#27AE60'
                      }}/>
                      Status: <strong>{hoverInfo.status}</strong>
                    </div>
                  </>
                )}
              </div>
            )}

            <svg viewBox="0 0 360 200" className={styles.mapSvg}>
              <path d="M 20 20 L 340 20 L 290 80 L 90 80 Z" className={styles.districtPath} onMouseEnter={() => handleDistrictHover('Região Norte', 'Equipes operando na zona norte')} onMouseLeave={handleMouseLeave} />
              <path d="M 90 80 L 290 80 L 250 140 L 130 140 Z" className={styles.districtPath} onMouseEnter={() => handleDistrictHover('Região Centro', 'Equipes operando no centro')} onMouseLeave={handleMouseLeave} />
              <path d="M 130 140 L 250 140 L 210 190 L 170 190 Z" className={styles.districtPath} onMouseEnter={() => handleDistrictHover('Região Sul', 'Equipes operando na zona sul')} onMouseLeave={handleMouseLeave} />
              <path d="M 20 20 L 90 80 L 130 140 L 170 190 L 20 190 Z" className={styles.districtPath} onMouseEnter={() => handleDistrictHover('Região Oeste', 'Equipes operando na zona oeste')} onMouseLeave={handleMouseLeave} />
              <path d="M 340 20 L 290 80 L 250 140 L 210 190 L 340 190 Z" className={styles.districtPath} onMouseEnter={() => handleDistrictHover('Região Leste', 'Equipes operando na zona leste')} onMouseLeave={handleMouseLeave} />
              
              {equipes.map((eq, idx) => {
                 let cx = 180, cy = 95;
                 if (eq.regiao === 'Norte') { cx = 200 + (idx*10); cy = 55; }
                 else if (eq.regiao === 'Sul') { cx = 190 + (idx*10); cy = 150; }
                 else if (eq.regiao === 'Leste') { cx = 280 + (idx*5); cy = 105 + (idx*5); }
                 else if (eq.regiao === 'Oeste') { cx = 95 + (idx*5); cy = 110 + (idx*5); }
                 else { cx = 180 + (idx*15); cy = 95; }
                 return (
                   <g key={eq.id} className={styles.mapPinGroup} onMouseEnter={() => handlePinHover(eq)} onMouseLeave={handleMouseLeave}>
                     <circle cx={cx} cy={cy} r="10" fill={eq.statusColor} opacity="0.35" className={styles.pulsingRing} />
                     <circle cx={cx} cy={cy} r="4.5" fill={eq.statusColor} className={styles.mapPinCircle} />
                   </g>
                 );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* NOVO MEMBRO MODAL */}
      {showNewMemberModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Adicionar Membro da Equipe</h3>
            
            <select value={newMemberData.perfil} onChange={e => setNewMemberData({...newMemberData, perfil: e.target.value})} className={styles.filterSelect} style={{width: '100%', margin: '10px 0'}}>
              <option value="TRABALHADOR">Trabalhador Operacional</option>
              <option value="GESTOR">Gestor Supervisor</option>
            </select>

            <input placeholder="Nome Completo" autoComplete="off" value={newMemberData.nome} onChange={e => setNewMemberData({...newMemberData, nome: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <input placeholder="CPF (Ex: 999.999.999-99)" autoComplete="off" value={newMemberData.cpf} onChange={e => setNewMemberData({...newMemberData, cpf: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <input placeholder="E-mail" type="email" autoComplete="off" value={newMemberData.email} onChange={e => setNewMemberData({...newMemberData, email: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <input placeholder="Senha" type="password" autoComplete="new-password" value={newMemberData.senha} onChange={e => setNewMemberData({...newMemberData, senha: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className={styles.newBtn} onClick={handleAddMember}>Salvar Membro</button>
              <button className={styles.clearBtn} onClick={() => setShowNewMemberModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* NOVA EQUIPE MODAL */}
      {showNewEquipeModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Criar Nova Equipe</h3>
            <input placeholder="Nome da Equipe (Ex: Equipe Limpeza Sul 01)" value={newEquipeData.nome} onChange={e => setNewEquipeData({...newEquipeData, nome: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <select value={newEquipeData.idOrgao} onChange={e => setNewEquipeData({...newEquipeData, idOrgao: e.target.value})} className={styles.filterSelect} style={{width: '100%', margin: '10px 0'}}>
              <option value="">Selecione o Órgão Público...</option>
              {orgaos.map(o => (
                <option key={o.id} value={o.id}>{o.nome} ({o.sigla})</option>
              ))}
            </select>
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className={styles.newBtn} onClick={handleCreateEquipe}>Salvar Equipe</button>
              <button className={styles.clearBtn} onClick={() => setShowNewEquipeModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* VER MEMBROS MODAL */}
      {showMembrosModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '600px' }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3>Membros da Equipe</h3>
              <button className={styles.clearBtn} onClick={() => setShowMembrosModal(false)}>X</button>
            </div>
            
            <div className={styles.tableWrapper} style={{marginTop: '15px'}}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>NOME</th>
                    <th>EMAIL</th>
                    <th>PERFIL / CARGO</th>
                  </tr>
                </thead>
                <tbody>
                  {membrosEquipe.map(m => (
                    <tr key={m.id}>
                      <td>{m.nome}</td>
                      <td>{m.email}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                          background: m.perfil === 'GESTOR' ? '#9B51E0' : '#2D9CDB', color: '#fff'
                        }}>
                          {m.perfil === 'GESTOR' ? 'Supervisor' : 'Trabalhador'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {membrosEquipe.length === 0 && (
                    <tr><td colSpan="3" style={{textAlign:'center', padding:'15px'}}>Nenhum membro encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação de Membros */}
            <div className={styles.pagination} style={{marginTop: '15px', justifyContent: 'center'}}>
              <button className={styles.pageBtn} disabled={membrosPage === 0} onClick={() => carregarMembros(viewingEquipeId, membrosPage - 1)}>‹</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Página {membrosPage + 1} de {membrosTotalPages}</span>
              <button className={styles.pageBtn} disabled={membrosPage >= membrosTotalPages - 1} onClick={() => carregarMembros(viewingEquipeId, membrosPage + 1)}>›</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ATRIBUIÇÃO */}
      {showAssignModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <h3>Atribuir Incidente</h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px'}}>
              Selecione um incidente da lista para enviar a esta equipe.
            </p>
            {selectedIncidentDetail && (
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(34, 109, 255, 0.08)',
                border: '1px solid rgba(92, 154, 255, 0.3)',
                marginBottom: '14px',
                color: 'var(--text-primary)'
              }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ocorrência selecionada</div>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>{selectedIncidentDetail.protocolo || 'Sem protocolo'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {selectedIncidentDetail.categoriaServico || 'Solicitação'} · {selectedIncidentDetail.status || 'PENDENTE'}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  {selectedIncidentDetail.nomeEquipe ? `Equipe atual: ${selectedIncidentDetail.nomeEquipe}` : 'Equipe atual: nenhuma'}
                </div>
              </div>
            )}

            {unassignedIncidents.length > 0 ? (
              <select value={selectedIncidentId} onChange={e => setSelectedIncidentId(e.target.value)} className={styles.filterSelect} style={{width: '100%', margin: '10px 0', padding: '10px'}}>
                <option value="">Selecione o protocolo...</option>
                {unassignedIncidents.map(inc => (
                  <option key={inc.id} value={inc.id}>{inc.protocolo || 'SEM PROTOCOLO'} - {inc.categoriaServico || 'Solicitação'} - {inc.status || 'PENDENTE'}</option>
                ))}
              </select>
            ) : (
              <div style={{padding: '15px', background: 'rgba(235, 87, 87, 0.1)', color: '#EB5757', borderRadius: '8px', marginBottom: '15px'}}>Nenhuma ocorrência disponível para atribuição.</div>
            )}

            <select
              value={selectedEquipeId || ''}
              onChange={(e) => setSelectedEquipeId(e.target.value || null)}
              className={styles.filterSelect}
              style={{ width: '100%', margin: '10px 0', padding: '10px' }}
            >
              <option value="">Selecione uma equipe...</option>
              {equipes.map((equipe) => (
                <option key={equipe.id} value={String(equipe.id)}>{equipe.nome}</option>
              ))}
            </select>
            
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className={styles.newBtn} onClick={handleAssignIncident} disabled={!selectedIncidentId || !selectedEquipeId}>Atribuir</button>
              <button className={styles.clearBtn} onClick={() => { setShowAssignModal(false); setSelectedIncidentId(''); setSelectedEquipeId(null); setSelectedIncidentDetail(null); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

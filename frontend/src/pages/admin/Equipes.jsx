import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRegion } from '../../contexts/RegionContext';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '../../components/layout/AdminLayout';
import { equipeService, orgaoService, ocorrenciaService, gestorService } from '../../services/api';
import useEnderecos from '../../hooks/useEnderecos';
import { MapPin, CheckCircle, Shield } from 'lucide-react';
import styles from './Equipes.module.css';

const PAGE_SIZE = 10;

const REGION_COORDINATES = {
  Centro: [-23.5505, -46.6333],
  Norte: [-23.4705, -46.5600],
  Sul: [-23.6505, -46.6500],
  Leste: [-23.5505, -46.4800],
  Oeste: [-23.5605, -46.7800],
};

const TEAM_STATUS_ITEMS = [
  { label: 'Todos', value: '', color: '#94A3B8' },
  { label: 'Em campo', value: 'Em campo', color: '#27AE60' },
  { label: 'Disponível', value: 'Disponível', color: '#F2C94C' },
  { label: 'Sobrecarr.', value: 'Sobrecarr.', color: '#EB5757' },
];

const INCIDENT_PRIORITY_ITEMS = [
  { label: 'Urgente', color: '#EB5757' },
  { label: 'Alta', color: '#F2994A' },
  { label: 'Em andamento', color: '#2F80ED' },
  { label: 'Em campo', color: '#27AE60' },
];

const TEAM_COLOR_PALETTE = ['#4CC9F0', '#7AE582', '#FFB703', '#F72585', '#00B4D8', '#FFD166', '#A78BFA', '#38B000', '#EF476F', '#06D6A0'];

function getTeamColor(team, index) {
  return team?.statusColor || TEAM_COLOR_PALETTE[index % TEAM_COLOR_PALETTE.length] || '#2F80ED';
}

function parseGps(gps) {
  if (!gps) return null;

  const raw = String(gps).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/\(|\)|\[|\]/g, '')
    .replace(/lat\s*[:=]/gi, ' latitude=')
    .replace(/lng\s*[:=]/gi, ' longitude=')
    .replace(/lon\s*[:=]/gi, ' longitude=')
    .replace(/;/g, ',')
    .replace(/,/g, ' ');

  const matches = Array.from(cleaned.matchAll(/[-+]?\d{1,3}(?:[.,]\d+)?/g), (match) => {
    const value = Number(match[0].replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }).filter((value) => value !== null);

  if (matches.length < 2) return null;

  let latitude = null;
  let longitude = null;

  if (/lat|latitude/i.test(raw) || /lng|lon|longitude/i.test(raw)) {
    const latitudeMatch = raw.match(/lat(?:itude)?\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);
    const longitudeMatch = raw.match(/(?:lng|lon|longitude)\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);

    if (latitudeMatch) latitude = Number(latitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim());
    if (longitudeMatch) longitude = Number(longitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim());
  }

  if (latitude === null || longitude === null) {
    latitude = matches[0];
    longitude = matches[1];
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { latitude, longitude };
}

function getTeamCoordinates(team, index) {
  const [latitude, longitude] = REGION_COORDINATES[team.regiao] || REGION_COORDINATES.Centro;
  const spreadLat = ((index % 3) - 1) * 0.014;
  const spreadLng = (Math.floor(index / 3) % 2 === 0 ? 1 : -1) * (0.018 + (index % 2) * 0.008);
  return [latitude + spreadLat, longitude + spreadLng];
}

function getIncidentColor(incidente) {
  const prioridade = (incidente?.prioridade || 'NORMAL').toUpperCase();
  const status = (incidente?.status || '').toUpperCase();

  if (prioridade === 'URGENTE') return '#EB5757';
  if (prioridade === 'ALTA') return '#F2994A';
  if (status === 'EM_CAMPO') return '#27AE60';
  if (status === 'EM_ANDAMENTO') return '#2F80ED';
  if (status === 'TRIAGEM') return '#9B51E0';
  if (status === 'PENDENTE') return '#F2994A';
  return '#6B7280';
}

function getIncidentLegendLabel(incidente) {
  const prioridade = (incidente?.prioridade || '').toUpperCase();
  const status = (incidente?.status || '').toUpperCase();

  if (prioridade === 'URGENTE') return 'Urgente';
  if (prioridade === 'ALTA') return 'Alta';
  if (status === 'EM_CAMPO') return 'Em campo';
  if (status === 'EM_ANDAMENTO') return 'Em andamento';
  return 'Em andamento';
}

function MapBoundsController({ teams, incidentesAtivos }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    teams.forEach((team, index) => {
      const ocorrenciasDaEquipe = incidentesAtivos.filter((incidente) => Number(incidente.idEquipe) === Number(team.id));
      const pontosAtuacao = ocorrenciasDaEquipe
        .map((incidente) => parseGps(incidente.gps))
        .filter(Boolean);

      if (pontosAtuacao.length > 0) {
        pontosAtuacao.forEach((ponto) => points.push([ponto.latitude, ponto.longitude]));
        return;
      }

      points.push(getTeamCoordinates(team, index));
    });

    // Mapa geral (sem camada de equipes): enquadra todas as ocorrências
    if (!teams.length) {
      incidentesAtivos
        .map((incidente) => parseGps(incidente.gps))
        .filter(Boolean)
        .forEach((ponto) => points.push([ponto.latitude, ponto.longitude]));
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(points, {
      padding: [28, 28],
      maxZoom: 13,
      animate: false,
    });
  }, [map, teams, incidentesAtivos]);

  return null;
}

export default function Equipes() {
  const location = useLocation();
  const { user } = useAuth();
  const { selectedRegion } = useRegion();
  const isAdmin = user?.perfil === 'ADMIN';
  const isGestor = user?.perfil === 'GESTOR';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regiaoFilter, setRegiaoFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [selectedMapTeams, setSelectedMapTeams] = useState([]);
  const [selectedIncidentPriorities, setSelectedIncidentPriorities] = useState([]);
  
  // Equipes Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [equipes, setEquipes] = useState([]);
  const [equipesMapa, setEquipesMapa] = useState([]);
  const [kpis, setKpis] = useState([]);
  
  // Membros Modal & Pagination
  const [showMembrosModal, setShowMembrosModal] = useState(false);
  const [membrosEquipe, setMembrosEquipe] = useState([]);
  const [membrosPage, setMembrosPage] = useState(0);
  const [membrosTotalPages, setMembrosTotalPages] = useState(1);
  const [viewingEquipeId, setViewingEquipeId] = useState(null);
  const [incidentesAtivos, setIncidentesAtivos] = useState([]);
  const enderecosIncidentes = useEnderecos(incidentesAtivos);

  // Map Hover
  const [hoverInfo, setHoverInfo] = useState(null);

  // Modals state
  const [showNewEquipeModal, setShowNewEquipeModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEquipeId, setSelectedEquipeId] = useState(null);
  const [statusEquipe, setStatusEquipe] = useState('EM_CAMPO');

  // Forms state
  const [newEquipeData, setNewEquipeData] = useState({ nome: '', idOrgao: '' });
  const [newMemberData, setNewMemberData] = useState({ nome: '', cpf: '', email: '', senha: '', perfil: 'TRABALHADOR' });
  const [orgaos, setOrgaos] = useState([]);
  
  // Unassigned incidents state
  const [unassignedIncidents, setUnassignedIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);

  // Gestores da plataforma (visão do ADMIN)
  const [gestores, setGestores] = useState([]);

  const carregarGestores = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const resp = await gestorService.listar();
      setGestores(resp.data?.data || []);
    } catch (err) {
      console.error('Erro ao carregar gestores:', err);
    }
  }, [isAdmin]);

  const carregarDados = useCallback(async () => {
    try {
      const [resp, mapaResp] = await Promise.all([
        equipeService.dashboard({ page, size: PAGE_SIZE }),
        equipeService.dashboard({ page: 0, size: 200 }),
      ]);
      const data = resp.data.data;
      const mapaData = mapaResp.data.data;
      const equipesVisiveis = user?.perfil === 'GESTOR'
        ? data.content.filter((equipe) => equipe.supervisor === user.nome)
        : data.content;
      const equipesMapaVisiveis = user?.perfil === 'GESTOR'
        ? mapaData.content.filter((equipe) => equipe.supervisor === user.nome)
        : mapaData.content;
      setEquipes(equipesVisiveis);
      setEquipesMapa(equipesMapaVisiveis);
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

    async function loadIncidentesAtivos() {
      try {
        const response = await ocorrenciaService.listar({ page: 0, size: 200 });
        const items = response.data?.data?.content || response.data?.content || [];
        const ativos = items.filter((incidente) =>
          incidente &&
          (isAdmin || (incidente.idEquipe !== null && incidente.idEquipe !== undefined)) &&
          (isAdmin
            ? !['CONCLUIDA', 'CANCELADA'].includes((incidente.status || '').toUpperCase())
            : ['EM_ANDAMENTO', 'EM_CAMPO'].includes((incidente.status || '').toUpperCase())) &&
          parseGps(incidente.gps)
        );
        setIncidentesAtivos(ativos);
      } catch (err) {
        console.error('Erro ao carregar ocorrências ativas:', err);
        setIncidentesAtivos([]);
      }
    }

    loadIncidentesAtivos();

    async function loadOrgaos() {
      try {
        const response = await orgaoService.listar();
        setOrgaos(response.data.data);
      } catch (err) {
        console.error("Erro ao carregar orgãos:", err);
      }
    }
    loadOrgaos();
    carregarGestores();
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

  const handleRemoverGestor = async (membro) => {
    if (!window.confirm(`Remover o gestor ${membro.nome} da equipe? O acesso dele será desativado.`)) return;
    try {
      await equipeService.removerMembro(membro.id);
      alert('Gestor removido com sucesso!');
      carregarDados();
      carregarGestores();
      await carregarMembros(viewingEquipeId, membrosPage);
    } catch (err) {
      alert('Erro ao remover gestor. ' + (err.response?.data?.message || ''));
    }
  };

  const handleRemoverGestorPlataforma = async (gestor) => {
    if (!window.confirm(`Remover o gestor ${gestor.nome} (equipe ${gestor.equipeNome})? O acesso dele será desativado.`)) return;
    try {
      await equipeService.removerMembro(gestor.id);
      alert('Gestor removido com sucesso!');
      carregarDados();
      carregarGestores();
    } catch (err) {
      alert('Erro ao remover gestor. ' + (err.response?.data?.message || ''));
    }
  };

  const handleAddMember = async () => {    if (!selectedEquipeId || !newMemberData.nome || !newMemberData.cpf || !newMemberData.email || !newMemberData.senha) {
      return alert('Preencha todos os dados do membro.');
    }

    try {
      const equipeId = Number(selectedEquipeId);
      await equipeService.adicionarMembro(equipeId, newMemberData);
      alert(isAdmin ? 'Gestor adicionado com sucesso!' : 'Membro adicionado com sucesso!');
      setShowNewMemberModal(false);
      setNewMemberData({ nome: '', cpf: '', email: '', senha: '', perfil: 'TRABALHADOR' });
      carregarDados();
      carregarGestores();
      if (!isAdmin) await carregarMembros(equipeId, 0);
    } catch (err) {
      alert('Erro ao adicionar membro. ' + (err.response?.data?.message || ''));
    }
  };

  const handleOpenAssignModal = async (equipeId, selectedIncident = null) => {
    setSelectedEquipeId(equipeId);
    const equipe = equipes.find((item) => String(item.id) === String(equipeId));
    setStatusEquipe(equipe?.status === 'Disponível' ? 'DISPONIVEL' : equipe?.status === 'Sobrecarr.' ? 'SOBRECARREGADA' : 'EM_CAMPO');
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
    if (!selectedIncidentIdFromState || !isGestor) return;

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
        statusEquipe,
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

  const matchesTeamFilters = (equipe) => {
    const matchesSearch = !search || equipe.nome.toLowerCase().includes(search.toLowerCase()) ||
      (equipe.supervisor && equipe.supervisor.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch &&
      (!statusFilter || equipe.status === statusFilter) &&
      (!regiaoFilter || equipe.regiao === regiaoFilter) &&
      (!selectedRegion || equipe.regiao === selectedRegion) &&
      (!tipoFilter || equipe.tipoServico === tipoFilter);
  };

  const filteredEquipes = equipes.filter(matchesTeamFilters);
  const filteredMapEquipes = equipesMapa.filter(matchesTeamFilters);

  const teamLegendEntries = filteredMapEquipes.map((team, index) => ({
    ...team,
    mapColor: getTeamColor(team, index),
  }));

  const visibleMapTeams = teamLegendEntries.filter((team) => {
    if (!selectedMapTeams.length) return true;
    return selectedMapTeams.includes(team.id);
  });

  const equipesEmCampo = filteredMapEquipes.filter((equipe) => equipe.status === 'Em campo');
  const tiposServico = [...new Set(equipes.map((equipe) => equipe.tipoServico).filter(Boolean))].sort();

  const toggleMapTeam = (teamId) => {
    setSelectedMapTeams((current) => {
      if (!current.length) return [teamId];
      if (current.includes(teamId)) {
        return current.filter((id) => id !== teamId);
      }
      return [...current, teamId];
    });
  };

  const toggleIncidentPriority = (priorityLabel) => {
    setSelectedIncidentPriorities((current) => {
      if (!current.length) return [priorityLabel];
      if (current.includes(priorityLabel)) {
        return current.filter((label) => label !== priorityLabel);
      }
      return [...current, priorityLabel];
    });
  };

  const visibleIncidentMarkers = incidentesAtivos.filter((incidente) => {
    if (!selectedIncidentPriorities.length) return true;
    return selectedIncidentPriorities.includes(getIncidentLegendLabel(incidente));
  });

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Gestão de Equipes</h1>
        {isGestor && <button className={styles.newBtn} onClick={() => setShowNewEquipeModal(true)}>+ Nova Equipe</button>}
      </div>

      <div className={styles.filterBar}>
        <input className={styles.searchInput} placeholder="Buscar equipe ou supervisor..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className={styles.filterSelect} value={tipoFilter} onChange={(event) => setTipoFilter(event.target.value)}>
          <option value="">Todos os tipos</option>
          {tiposServico.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
        <select className={styles.filterSelect} value={regiaoFilter} onChange={(event) => setRegiaoFilter(event.target.value)}>
          <option value="">Todas as regiões</option>
          {['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'].map((regiao) => <option key={regiao} value={regiao}>{regiao}</option>)}
        </select>
        <select className={styles.filterSelect} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">Todos os status</option>
          <option value="Em campo">Em campo</option>
          <option value="Disponível">Disponível</option>
          <option value="Sobrecarr.">Sobrecarregada</option>
        </select>
        {(search || tipoFilter || regiaoFilter || statusFilter) && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setTipoFilter(''); setRegiaoFilter(''); setStatusFilter(''); }}>
            Limpar filtros
          </button>
        )}
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
                      {isGestor && (
                        <>
                          <button className={styles.actionBtnPurple} onClick={() => handleOpenAssignModal(e.id)}>+ Incidente</button>
                          <button className={styles.actionBtnBlue} onClick={() => { setSelectedEquipeId(e.id); setNewMemberData(d => ({ ...d, perfil: 'TRABALHADOR' })); setShowNewMemberModal(true); }}>+ Membro</button>
                        </>
                      )}
                      {isAdmin && (
                        <button className={styles.actionBtnPurple} onClick={() => { setSelectedEquipeId(e.id); setNewMemberData(d => ({ ...d, perfil: 'GESTOR' })); setShowNewMemberModal(true); }}>+ Gestor</button>
                      )}
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

      {/* Gestores da Plataforma (ADMIN) */}
      {isAdmin && (
        <div className={styles.tableCard} style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 0' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Gestores da Plataforma</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {gestores.length} gestor(es) ativo(s) — o administrador pode adicionar e remover gestores
              </p>
            </div>
            <button
              className={styles.newBtn}
              onClick={() => { setSelectedEquipeId(null); setNewMemberData({ nome: '', cpf: '', email: '', senha: '', perfil: 'GESTOR' }); setShowNewMemberModal(true); }}
            >
              + Gestor
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th><th>NOME</th><th>E-MAIL</th><th>CPF</th><th>EQUIPE</th><th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {gestores.map((g) => (
                  <tr key={g.id}>
                    <td className={styles.id}>GST-{String(g.id).padStart(2, '0')}</td>
                    <td className={styles.teamName}>{g.nome}</td>
                    <td className={styles.muted}>{g.email}</td>
                    <td className={styles.muted}>{g.cpf}</td>
                    <td>{g.equipeNome}</td>
                    <td>
                      <button
                        style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', background: '#EB5757', color: '#fff', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleRemoverGestorPlataforma(g)}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                {gestores.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center', padding:'20px'}}>Nenhum gestor cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Row */}
      <div className={styles.bottomGrid}>
        <div className={styles.mapCard}>
          <div className={styles.mapCardHeader}>
            <div>
              <h3>{isAdmin ? 'Mapa Geral de Ocorrências' : 'Mapa de Alocação (Visão Geral)'}</h3>
              <p className={styles.mapSubtitle}>
                {isAdmin
                  ? 'Visão nacional de todas as ocorrências ativas registradas no sistema'
                  : 'Distribuição das equipes e ocorrências atribuídas em tempo real'}
              </p>
            </div>
            <div className={styles.mapStats}>
              {(isGestor || isAdmin) && (
                <>
                  <span className={styles.mapStat}>
                    <span className={styles.mapStatDot} style={{ background: '#2F80ED' }} />
                    {visibleMapTeams.length} equipes no mapa
                  </span>
                  <span className={styles.mapStat}>
                    <span className={styles.mapStatDot} style={{ background: '#27AE60' }} />
                    {equipesEmCampo.length} em campo
                  </span>
                </>
              )}
              <span className={styles.mapStat}>
                <span className={styles.mapStatDot} style={{ background: '#EB5757' }} />
                {incidentesAtivos.length} ocorrências ativas
              </span>
            </div>
          </div>
          <div className={styles.mapContainer}>
            <MapContainer
              key={`${statusFilter || 'all'}-${filteredEquipes.length}`}
              center={REGION_COORDINATES.Centro}
              zoom={11}
              minZoom={10}
              maxZoom={16}
              scrollWheelZoom
              className={styles.allocationMap}
            >
              <MapBoundsController teams={visibleMapTeams} incidentesAtivos={incidentesAtivos} />
              <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {isAdmin && visibleIncidentMarkers.map((incidente) => {
                const gps = parseGps(incidente.gps);
                if (!gps) return null;
                const incidentColor = getIncidentColor(incidente);
                return (
                  <CircleMarker
                    key={`geral-${incidente.id}`}
                    center={[gps.latitude, gps.longitude]}
                    radius={6}
                    pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: incidentColor, fillOpacity: 0.8 }}
                  >
                    <Popup className={styles.mapPopup}>
                      <div className={styles.popupTitle} style={{ borderLeftColor: incidentColor }}>
                        {incidente.descricao || 'Ocorrência registrada'}
                      </div>
                      <div className={styles.popupBadges}>
                        <span className={styles.popupBadge} style={{ background: incidentColor }}>
                          {incidente.prioridade || 'NORMAL'}
                        </span>
                        <span className={styles.popupBadgeOutline}>{String(incidente.status || '').replace('_', ' ')}</span>
                      </div>
                      {incidente.nomeEquipe && (
                        <div className={styles.popupRow}><span>Equipe</span><strong>{incidente.nomeEquipe}</strong></div>
                      )}
                      <div className={styles.popupAddress}>
                        📍 {incidente.endereco || enderecosIncidentes[incidente.gps] || incidente.gps || 'Localização disponível'}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
              {(isGestor || isAdmin) && visibleMapTeams.map((team, index) => {
                const teamColor = getTeamColor(team, index);
                const ocorrenciasDaEquipe = visibleIncidentMarkers.filter((incidente) => Number(incidente.idEquipe) === Number(team.id));
                const pontosAtuacao = ocorrenciasDaEquipe
                  .map((incidente) => parseGps(incidente.gps))
                  .filter(Boolean);

                const coordinates = pontosAtuacao.length
                  ? [
                      pontosAtuacao.reduce((sum, p) => sum + p.latitude, 0) / pontosAtuacao.length,
                      pontosAtuacao.reduce((sum, p) => sum + p.longitude, 0) / pontosAtuacao.length,
                    ]
                  : getTeamCoordinates(team, index);

                const areaRadius = pontosAtuacao.length
                  ? Math.max(0.003, (pontosAtuacao.length * 0.0018) + 0.002)
                  : 0.004;

                return (
                  <div key={`team-layer-${team.id}`}>
                    {pontosAtuacao.length > 0 && (
                      <Circle
                        key={`area-${team.id}`}
                        center={coordinates}
                        radius={areaRadius * 1000}
                        pathOptions={{
                          color: teamColor,
                          fillColor: teamColor,
                          fillOpacity: 0.12,
                          weight: 1.5,
                          dashArray: '6 8',
                        }}
                      />
                    )}

                    <CircleMarker key={`team-${team.id}`} center={coordinates} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: teamColor, fillOpacity: 0.9 }}>
                      <Popup className={styles.mapPopup}>
                        <div className={styles.popupTitle} style={{ borderLeftColor: teamColor }}>{team.nome}</div>
                        <div className={styles.popupRow}><span>Supervisor</span><strong>{team.supervisor}</strong></div>
                        <div className={styles.popupRow}><span>Região</span><strong>{team.regiao}</strong></div>
                        <div className={styles.popupRow}><span>Casos abertos</span><strong>{team.casosAbertos}</strong></div>
                        <div className={styles.popupRow}><span>Status</span><strong>{team.status}</strong></div>
                        <div className={styles.popupFooter}>
                          {pontosAtuacao.length > 0 ? `${pontosAtuacao.length} ocorrência(s) em atuação` : 'Sem ocorrências em andamento'}
                        </div>
                      </Popup>
                    </CircleMarker>

                    {ocorrenciasDaEquipe.map((incidente) => {
                      const gps = parseGps(incidente.gps);
                      if (!gps) return null;

                      const incidentColor = getIncidentColor(incidente);

                      return (
                        <CircleMarker
                          key={`incident-${incidente.id}`}
                          center={[gps.latitude, gps.longitude]}
                          radius={5}
                          pathOptions={{
                            color: '#ffffff',
                            weight: 1.5,
                            fillColor: incidentColor,
                            fillOpacity: 0.7,
                            opacity: 0.7,
                          }}
                        >
                          <Popup className={styles.mapPopup}>
                            <div className={styles.popupTitle} style={{ borderLeftColor: incidentColor }}>
                              {incidente.descricao || 'Ocorrência em andamento'}
                            </div>
                            <div className={styles.popupBadges}>
                              <span className={styles.popupBadge} style={{ background: incidentColor }}>
                                {incidente.prioridade || 'NORMAL'}
                              </span>
                              <span className={styles.popupBadgeOutline}>{String(incidente.status || '').replace('_', ' ')}</span>
                            </div>
                            <div className={styles.popupAddress}>
                              📍 {incidente.endereco || enderecosIncidentes[incidente.gps] || incidente.gps || 'Localização disponível'}
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </div>
                );
              })}
            </MapContainer>
          </div>

          <div className={styles.mapLegend}>
            {(isGestor || isAdmin) && (
            <div className={styles.legendSection}>
              <div className={styles.legendSectionTitle}>Equipes</div>
              <div className={styles.legendItems}>
                {teamLegendEntries.map((team) => {
                  const isActive = selectedMapTeams.includes(team.id);
                  return (
                    <button
                      key={`team-legend-${team.id}`}
                      type="button"
                      className={[styles.legendItem, isActive ? styles.legendItemActive : ''].join(' ')}
                      onClick={() => toggleMapTeam(team.id)}
                      aria-pressed={isActive}
                      style={isActive ? { borderColor: team.mapColor, background: `${team.mapColor}1a` } : { opacity: 0.55 }}
                    >
                      <span className={styles.legendDot} style={{ background: team.mapColor }} />
                      <span>{team.nome.replace('Equipe ', '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            )}

            <div className={styles.legendSection}>
              <div className={styles.legendSectionTitle}>Ocorrências</div>
              <div className={styles.legendItems}>
                {INCIDENT_PRIORITY_ITEMS.map((item) => {
                  const isActive = selectedIncidentPriorities.includes(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={[styles.legendItem, isActive ? styles.legendItemActive : ''].join(' ')}
                      onClick={() => toggleIncidentPriority(item.label)}
                      aria-pressed={isActive}
                      style={isActive ? { borderColor: item.color, background: `${item.color}1a` } : { opacity: 0.55 }}
                    >
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {isGestor && equipesEmCampo.length > 0 && (
            <div className={styles.fieldDetailsList}>
              <span className={styles.fieldDetailsLabel}>Em campo agora</span>
              {equipesEmCampo.map((equipe) => (
                <div key={equipe.id} className={styles.fieldDetailItem}>
                  <span className={styles.fieldDot} />
                  <span>{equipe.nome.replace('Equipe ', '')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* NOVO MEMBRO MODAL */}
      {showNewMemberModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{isAdmin ? 'Adicionar Gestor à Equipe' : 'Adicionar Membro da Equipe'}</h3>

            <div style={{margin: '10px 0', padding: '8px 12px', borderRadius: '6px', background: 'var(--background)', border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)'}}>
              Perfil: <strong style={{color: 'var(--text-primary)'}}>{isAdmin ? 'Gestor Supervisor' : 'Trabalhador Operacional'}</strong>
            </div>

            {isAdmin && (
              <select
                value={selectedEquipeId || ''}
                onChange={e => setSelectedEquipeId(e.target.value ? Number(e.target.value) : null)}
                className={styles.filterSelect}
                style={{width: '100%', margin: '10px 0'}}
              >
                <option value="">Selecione a equipe do gestor…</option>
                {equipes.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            )}

            <input placeholder="Nome Completo" autoComplete="off" value={newMemberData.nome} onChange={e => setNewMemberData({...newMemberData, nome: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <input placeholder="CPF (Ex: 999.999.999-99)" autoComplete="off" value={newMemberData.cpf} onChange={e => setNewMemberData({...newMemberData, cpf: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <input placeholder="E-mail" type="email" autoComplete="off" value={newMemberData.email} onChange={e => setNewMemberData({...newMemberData, email: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            <input placeholder="Senha" type="password" autoComplete="new-password" value={newMemberData.senha} onChange={e => setNewMemberData({...newMemberData, senha: e.target.value})} className={styles.searchInput} style={{width: '100%', margin: '10px 0'}}/>
            
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button className={styles.newBtn} onClick={handleAddMember}>{isAdmin ? 'Salvar Gestor' : 'Salvar Membro'}</button>
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
                    {isAdmin && <th>AÇÕES</th>}
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
                      {isAdmin && (
                        <td>
                          {m.perfil === 'GESTOR' && (
                            <button
                              className={styles.clearBtn}
                              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '0.72rem', padding: '4px 10px' }}
                              onClick={() => handleRemoverGestor(m)}
                            >
                              Remover
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {membrosEquipe.length === 0 && (
                    <tr><td colSpan={isAdmin ? 4 : 3} style={{textAlign:'center', padding:'15px'}}>Nenhum membro encontrado.</td></tr>
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

            <label style={{ display: 'block', marginTop: '12px', fontSize: '0.82rem', fontWeight: 600 }}>Status operacional da equipe</label>
            <select
              value={statusEquipe}
              onChange={(event) => setStatusEquipe(event.target.value)}
              className={styles.filterSelect}
              style={{ width: '100%', margin: '8px 0', padding: '10px' }}
            >
              <option value="DISPONIVEL">Disponível</option>
              <option value="EM_CAMPO">Em campo</option>
              <option value="SOBRECARREGADA">Sobrecarregada</option>
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

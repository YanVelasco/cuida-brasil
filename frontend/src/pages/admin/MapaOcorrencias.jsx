import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '../../components/layout/AdminLayout';
import { useRegion } from '../../contexts/RegionContext';
import { ocorrenciaService, equipeService } from '../../services/api';
import styles from './MapaOcorrencias.module.css';

const STATUS_META = {
  PENDENTE: { label: 'Pendente', color: '#F2994A' },
  TRIAGEM: { label: 'Triagem', color: '#9B51E0' },
  EM_ANDAMENTO: { label: 'Em andamento', color: '#2F80ED' },
  EM_CAMPO: { label: 'Em campo', color: '#27AE60' },
  CONCLUIDA: { label: 'Concluída', color: '#27AE60' },
  CANCELADA: { label: 'Cancelada', color: '#EB5757' },
};

const PRIORITY_META = {
  URGENTE: { label: 'Urgente', color: '#EB5757' },
  ALTA: { label: 'Alta', color: '#F2994A' },
  MEDIA: { label: 'Média', color: '#2F80ED' },
  BAIXA: { label: 'Baixa', color: '#27AE60' },
  NORMAL: { label: 'Normal', color: '#6B7280' },
};

function resolveRegionFromGps(gps) {
  if (!gps) return 'Centro';

  const raw = String(gps).trim();
  if (!raw) return 'Centro';

  const matches = Array.from(raw.matchAll(/[-+]?\d{1,3}(?:[.,]\d+)?/g), (match) => {
    const value = Number(match[0].replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }).filter((value) => value !== null);

  if (matches.length < 2) return 'Centro';

  const latitudeText = raw.match(/lat(?:itude)?\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i)?.[0]?.split(/[:=]/).pop() ?? String(matches[0]);
  const longitudeText = raw.match(/(?:lng|lon|longitude)\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i)?.[0]?.split(/[:=]/).pop() ?? String(matches[1]);

  const latitude = Number(latitudeText.replace(',', '.').trim());
  const longitude = Number(longitudeText.replace(',', '.').trim());

  if (latitude < -23.65 && longitude < -46.7) return 'Sul';
  if (latitude > -23.45 && longitude < -46.5) return 'Norte';
  if (longitude > -46.5) return 'Leste';
  if (longitude < -46.8) return 'Oeste';
  return 'Centro';
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
  const hasLatitudeLabel = /lat|latitude/i.test(raw);
  const hasLongitudeLabel = /lng|lon|longitude/i.test(raw);

  if (hasLatitudeLabel || hasLongitudeLabel) {
    const latitudeMatch = raw.match(/lat(?:itude)?\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);
    const longitudeMatch = raw.match(/(?:lng|lon|longitude)\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);

    if (latitudeMatch) latitude = Number(latitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim());
    if (longitudeMatch) longitude = Number(longitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim());
  }

  if (latitude === null || longitude === null) {
    const [first, second] = matches;
    if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
      latitude = first;
      longitude = second;
    } else {
      latitude = first;
      longitude = second;
    }
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
}

function normalize(value, min, max) {
  if (max === min) return 50;
  const normalized = ((value - min) / (max - min)) * 100;
  return Math.min(Math.max(normalized, 0), 100);
}

function regionCenterFromName(region) {
  const centers = {
    Centro: [-23.55, -46.63],
    Norte: [-23.47, -46.54],
    Sul: [-23.66, -46.69],
    Leste: [-23.55, -46.46],
    Oeste: [-23.56, -46.79],
  };

  return centers[region] || [-23.55, -46.63];
}

function MapFitBounds({ items, selected, selectedRegion }) {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      const gps = parseGps(selected.gps);
      if (gps) {
        map.setView([gps.latitude, gps.longitude], Math.max(map.getZoom(), 13), { animate: true });
      }
      return;
    }

    if (selectedRegion) {
      map.setView(regionCenterFromName(selectedRegion), 12, { animate: true });
      return;
    }

    if (!items.length) return;

    const validPoints = items
      .map((item) => {
        const gps = parseGps(item.gps);
        if (!gps) return null;
        return [gps.latitude, gps.longitude];
      })
      .filter(Boolean);

    if (!validPoints.length) return;

    const bounds = L.latLngBounds(validPoints);
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.25), { animate: true, maxZoom: 14 });
    }
  }, [items, map, selected, selectedRegion]);

  return null;
}

export default function MapaOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [legendFilter, setLegendFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [mapRegionFilter, setMapRegionFilter] = useState('');
  const [gestorFilter, setGestorFilter] = useState('');
  const [gestores, setGestores] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedRegion } = useRegion();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadOcorrencias() {
      try {
        const response = await ocorrenciaService.listar({ page: 0, size: 200, ...(gestorFilter ? { gestor: gestorFilter } : {}) });
        const items = response.data?.data?.content || response.data?.content || [];

        if (isMounted) {
          setOcorrencias(items);
          setSelected(null);
        }
      } catch (error) {
        console.error('Erro ao carregar ocorrências:', error);
        if (isMounted) {
          setOcorrencias([]);
          setSelected(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOcorrencias();
    return () => { isMounted = false; };
  }, [gestorFilter]);

  useEffect(() => {
    equipeService.dashboard({ page: 0, size: 200 })
      .then((response) => {
        const data = response.data?.data || response.data || {};
        const items = Array.isArray(data) ? data : (data.content || []);
        setGestores([...new Set(items.map((item) => item.supervisor).filter((nome) => nome && nome !== 'Sem supervisor'))].sort());
      })
      .catch(() => setGestores([]));
  }, []);

  const mappedOcorrencias = useMemo(() => {
    const valid = ocorrencias.filter((oc) => parseGps(oc.gps));
    if (!valid.length) return [];

    const coords = valid.map((oc) => parseGps(oc.gps));
    const latitudes = coords.map((c) => c.latitude);
    const longitudes = coords.map((c) => c.longitude);

    const latMin = Math.min(...latitudes);
    const latMax = Math.max(...latitudes);
    const lngMin = Math.min(...longitudes);
    const lngMax = Math.max(...longitudes);

    return valid.map((oc) => {
      const gps = parseGps(oc.gps);
      const x = normalize(gps.longitude, lngMin, lngMax);
      const y = 100 - normalize(gps.latitude, latMin, latMax);

      return {
        ...oc,
        x: Math.min(Math.max(x, 0), 100),
        y: Math.min(Math.max(y, 0), 100),
        statusMeta: STATUS_META[oc.status] || { label: oc.status || 'Indefinido', color: '#6B7280' },
        priorityMeta: PRIORITY_META[(oc.prioridade || 'NORMAL').toUpperCase()] || PRIORITY_META.NORMAL,
      };
    });
  }, [ocorrencias]);

  const priorityFilters = useMemo(() => {
    const present = new Set(mappedOcorrencias.map((oc) => (oc.prioridade || 'NORMAL').toUpperCase()));

    return [
      ...(present.has('URGENTE') ? [{ label: 'Urgente', value: 'URGENTE', color: '#EB5757' }] : []),
      ...(present.has('ALTA') ? [{ label: 'Alta', value: 'ALTA', color: '#F2994A' }] : []),
      ...(present.has('MEDIA') ? [{ label: 'Média', value: 'MEDIA', color: '#2F80ED' }] : []),
      ...(present.has('BAIXA') ? [{ label: 'Baixa', value: 'BAIXA', color: '#27AE60' }] : []),
    ];
  }, [mappedOcorrencias]);

  const legendItems = useMemo(() => {
    const presentStatus = new Set(mappedOcorrencias.map((oc) => (oc.status || '').toUpperCase()));
    const presentPriority = new Set(mappedOcorrencias.map((oc) => (oc.prioridade || 'NORMAL').toUpperCase()));

    const entries = [
      { label: 'Pendente', value: 'PENDENTE', color: '#F2994A' },
      { label: 'Triagem', value: 'TRIAGEM', color: '#9B51E0' },
      { label: 'Em andamento', value: 'EM_ANDAMENTO', color: '#2F80ED' },
      { label: 'Em campo', value: 'EM_CAMPO', color: '#27AE60' },
      { label: 'Concluída', value: 'CONCLUIDA', color: '#27AE60' },
      { label: 'Cancelada', value: 'CANCELADA', color: '#EB5757' },
      { label: 'Urgente', value: 'URGENTE', color: '#EB5757' },
      { label: 'Alta', value: 'ALTA', color: '#F2994A' },
      { label: 'Média', value: 'MEDIA', color: '#2F80ED' },
      { label: 'Baixa', value: 'BAIXA', color: '#27AE60' },
    ].filter((entry) => {
      const isStatus = presentStatus.has(entry.value);
      const isPriority = presentPriority.has(entry.value);
      return isStatus || isPriority;
    });

    return entries;
  }, [mappedOcorrencias]);

  const filteredOcorrencias = useMemo(() => {
    return mappedOcorrencias.filter((oc) => {
      const region = resolveRegionFromGps(oc.gps);
      const statusValue = (oc.status || '').toUpperCase();
      const priorityValue = (oc.prioridade || 'NORMAL').toUpperCase();

      if (selectedRegion && region !== selectedRegion) return false;
      if (mapRegionFilter && region !== mapRegionFilter) return false;
      if (categoryFilter && oc.categoriaServico !== categoryFilter) return false;
      if (legendFilter && statusValue !== legendFilter && priorityValue !== legendFilter) return false;

      if (activeFilter) {
        if (activeFilter === 'Urgente' && priorityValue !== 'URGENTE') return false;
        if (activeFilter === 'Alta' && priorityValue !== 'ALTA') return false;
        if (activeFilter === 'Média' && priorityValue !== 'MEDIA') return false;
        if (activeFilter === 'Baixa' && priorityValue !== 'BAIXA') return false;
      }

      return true;
    });
  }, [mappedOcorrencias, selectedRegion, mapRegionFilter, categoryFilter, activeFilter, legendFilter]);

  const categoryOptions = useMemo(() => (
    [...new Set(ocorrencias.map((oc) => oc.categoriaServico).filter(Boolean))].sort()
  ), [ocorrencias]);

  useEffect(() => {
    if (!filteredOcorrencias.length) {
      setSelected(null);
      return;
    }

    if (selected && !filteredOcorrencias.some((item) => item.id === selected.id)) {
      setSelected(null);
    }
  }, [filteredOcorrencias, selected]);

  const activeSelected = selected && filteredOcorrencias.some((item) => item.id === selected.id)
    ? filteredOcorrencias.find((item) => item.id === selected.id)
    : null;

  const selectedStatus = activeSelected?.statusMeta || { label: 'Sem seleção', color: '#6B7280' };
  const canAssignEquipe = !!activeSelected;
  const assignButtonLabel = activeSelected?.nomeEquipe ? 'Atribuir/alterar equipe' : 'Atribuir equipe';

  const handleMarkerClick = (oc) => {
    setSelected((current) => (current && current.id === oc.id ? null : oc));
  };

  const handleLegendClick = (value) => {
    setLegendFilter((current) => (current === value ? '' : value));
    setSelected(null);
  };

  const handleAssignEquipe = () => {
    if (!activeSelected) {
      alert('Selecione uma ocorrência antes de atribuir uma equipe.');
      return;
    }

    navigate('/admin/equipes', { state: { selectedIncidentId: activeSelected.id } });
  };

  const handleVerDetalhes = () => {
    if (!activeSelected) {
      alert('Selecione uma ocorrência para ver os detalhes.');
      return;
    }

    navigate('/admin/solicitacoes', { state: { selectedIncidentId: activeSelected.id } });
  };

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Mapa de Ocorrências</h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.mapWrapper}>
          <div className={styles.mapArea}>
            {loading ? (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                Carregando ocorrências...
              </div>
            ) : filteredOcorrencias.length === 0 ? (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                Nenhuma ocorrência encontrada para o filtro atual.
              </div>
            ) : (
              <MapContainer
                center={[-23.55, -46.63]}
                zoom={12}
                scrollWheelZoom
                className={styles.mapLeaflet}
                zoomControl
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapFitBounds items={filteredOcorrencias} selected={selected} selectedRegion={selectedRegion} />

                {filteredOcorrencias.map((oc) => {
                  const gps = parseGps(oc.gps);
                  if (!gps) return null;

                  const isActive = selected?.id === oc.id;

                  return (
                    <CircleMarker
                      key={oc.id}
                      center={[gps.latitude, gps.longitude]}
                      radius={isActive ? 12 : 8}
                      pathOptions={{
                        color: oc.statusMeta.color,
                        fillColor: oc.statusMeta.color,
                        fillOpacity: isActive ? 0.9 : 0.7,
                        weight: isActive ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => handleMarkerClick(oc),
                      }}
                    >
                      <Popup
                        autoClose={false}
                        closeButton={false}
                        keepInView
                        className={styles.mapPopup}
                      >
                        <strong>{oc.descricao || 'Ocorrência'}</strong><br />
                        {oc.statusMeta.label}<br />
                        {oc.endereco || oc.gps || 'Localização não informada'}
                      </Popup>
                    </CircleMarker>
                  );
                })}

                {activeSelected && (() => {
                  const gps = parseGps(activeSelected.gps);
                  if (!gps) return null;
                  return <CircleMarker center={[gps.latitude, gps.longitude]} radius={0} opacity={0} fillOpacity={0} />;
                })()}
              </MapContainer>
            )}

            <div className={styles.mapLegend}>
              {legendItems.map((item) => {
                const isActive = legendFilter === item.value;
                return (
                  <button
                    key={item.label}
                    type="button"
                    className={[styles.legendItem, isActive ? styles.legendItemActive : ''].join(' ')}
                    onClick={() => handleLegendClick(item.value)}
                    style={{
                      borderColor: isActive ? item.color : 'rgba(255,255,255,0.08)',
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                  >
                    <span className={styles.legendDot} style={{ background: item.color }} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>FILTROS</div>
            <select
              className={styles.sideSelect}
              value={gestorFilter}
              onChange={(event) => setGestorFilter(event.target.value)}
            >
              <option value="">Todos os gestores</option>
              {gestores.map((gestor) => <option key={gestor} value={gestor}>{gestor}</option>)}
            </select>
            <select
              className={styles.sideSelect}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todos os tipos</option>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select
              className={styles.sideSelect}
              value={mapRegionFilter}
              onChange={(event) => setMapRegionFilter(event.target.value)}
            >
              <option value="">Todas as regiões</option>
              {['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'].map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <div className={styles.prioFilters}>
              {priorityFilters.map((f) => (
                <button
                  key={f.label}
                  className={styles.prioBtn}
                  style={{
                    borderColor: f.color,
                    color: activeFilter === f.label ? '#fff' : f.color,
                    background: activeFilter === f.label ? f.color : 'transparent',
                  }}
                  onClick={() => setActiveFilter(activeFilter === f.label ? null : f.label)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>OCORRÊNCIA SELECIONADA</div>
            {activeSelected ? (
              <div className={styles.selectedCard}>
                <span className={styles.urgentBadge} style={{ background: selectedStatus.color }}>
                  {selectedStatus.label}
                </span>
                <p className={styles.selectedTitle}>{activeSelected.descricao || 'Ocorrência sem descrição'}</p>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {activeSelected.endereco || activeSelected.gps || 'Localização não informada'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Protocolo: {activeSelected.protocolo || '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Prioridade: {activeSelected.priorityMeta?.label || 'Normal'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  Equipe: {activeSelected.nomeEquipe || 'Ainda não atribuída'}
                </div>
                <div className={styles.selectedImg} />
              </div>
            ) : (
              <div className={styles.noSelected}>
                <span className={styles.urgentBadge} style={{ background: '#EB5757' }}>Sem seleção</span>
                <div className={styles.selectedImg} />
              </div>
            )}
            <button className={styles.blueBtn} onClick={handleAssignEquipe} type="button" disabled={!canAssignEquipe}>
              {assignButtonLabel}
            </button>
            <button className={styles.outlineBtn} onClick={handleVerDetalhes} type="button" disabled={!canAssignEquipe}>Ver detalhes</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

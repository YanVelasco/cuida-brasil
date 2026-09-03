import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useRegion } from '../../contexts/RegionContext';
import { ocorrenciaService } from '../../services/api';
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

const PRIO_FILTERS = [
  { label: 'Urgente', color: '#EB5757' },
  { label: 'Alta', color: '#F2994A' },
  { label: 'Média', color: '#2F80ED' },
  { label: 'Baixa', color: '#27AE60' },
];

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

export default function MapaOcorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [mapRegionFilter, setMapRegionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { selectedRegion } = useRegion();

  useEffect(() => {
    let isMounted = true;

    async function loadOcorrencias() {
      try {
        const response = await ocorrenciaService.listar({ page: 0, size: 200 });
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

  const filteredOcorrencias = useMemo(() => {
    return mappedOcorrencias.filter((oc) => {
      const region = resolveRegionFromGps(oc.gps);
      if (selectedRegion && region !== selectedRegion) return false;
      if (mapRegionFilter && region !== mapRegionFilter) return false;
      if (categoryFilter && oc.categoriaServico !== categoryFilter) return false;

      if (activeFilter) {
        const priorityValue = (oc.prioridade || 'NORMAL').toUpperCase();
        if (activeFilter === 'Urgente' && priorityValue !== 'URGENTE') return false;
        if (activeFilter === 'Alta' && priorityValue !== 'ALTA') return false;
        if (activeFilter === 'Média' && priorityValue !== 'MEDIA') return false;
        if (activeFilter === 'Baixa' && priorityValue !== 'BAIXA') return false;
      }

      return true;
    });
  }, [mappedOcorrencias, selectedRegion, mapRegionFilter, categoryFilter, activeFilter]);

  const categoryOptions = useMemo(() => (
    [...new Set(ocorrencias.map((oc) => oc.categoriaServico).filter(Boolean))].sort()
  ), [ocorrencias]);

  useEffect(() => {
    if (!filteredOcorrencias.length) {
      setSelected(null);
      return;
    }

    const hasSelected = selected && filteredOcorrencias.some((item) => item.id === selected.id);
    if (!hasSelected) {
      setSelected(filteredOcorrencias[0]);
    }
  }, [filteredOcorrencias, selected]);

  const activeSelected = selected && filteredOcorrencias.some((item) => item.id === selected.id)
    ? filteredOcorrencias.find((item) => item.id === selected.id)
    : filteredOcorrencias[0] || null;

  const selectedStatus = activeSelected?.statusMeta || { label: 'Sem seleção', color: '#6B7280' };

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Mapa de Ocorrências</h1>
      </div>

      <div className={styles.layout}>
        <div className={styles.mapWrapper}>
          <div className={styles.mapArea}>
            <div className={styles.gridLines}>
              {[25, 50, 75].map((p) => (
                <div key={'v' + p} className={styles.vLine} style={{ left: p + '%' }} />
              ))}
              {[25, 50, 75].map((p) => (
                <div key={'h' + p} className={styles.hLine} style={{ top: p + '%' }} />
              ))}
            </div>

            <div className={styles.heatCircle} />
            <div className={styles.heatLabel}>{filteredOcorrencias.length || 0}</div>

            <div className={styles.zoomControls}>
              <button className={styles.zoomBtn}>+</button>
              <button className={styles.zoomBtn}>−</button>
            </div>

            {loading ? (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                Carregando ocorrências...
              </div>
            ) : filteredOcorrencias.length === 0 ? (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
                Nenhuma ocorrência encontrada para o filtro atual.
              </div>
            ) : (
              filteredOcorrencias.map((oc) => (
                <button
                  key={oc.id}
                  className={[styles.pin, selected?.id === oc.id ? styles.pinActive : ''].join(' ')}
                  style={{ left: oc.x + '%', top: oc.y + '%', background: oc.statusMeta.color }}
                  onClick={() => setSelected(selected?.id === oc.id ? null : oc)}
                  title={`${oc.descricao || 'Ocorrência'} - ${oc.statusMeta.label}`}
                />
              ))
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sideSection}>
            <div className={styles.sideSectionTitle}>FILTROS</div>
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
              {PRIO_FILTERS.map((f) => (
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
                <div className={styles.selectedImg} />
              </div>
            ) : (
              <div className={styles.noSelected}>
                <span className={styles.urgentBadge} style={{ background: '#EB5757' }}>Sem seleção</span>
                <div className={styles.selectedImg} />
              </div>
            )}
            <button className={styles.blueBtn}>Atribuir equipe</button>
            <button className={styles.outlineBtn}>Ver detalhes</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

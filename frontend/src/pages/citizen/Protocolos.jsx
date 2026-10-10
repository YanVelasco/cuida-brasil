import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CopyPlus, FileText, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import styles from './Protocolos.module.css';

const STATUS_LABELS = {
  PENDENTE: 'Pendente',
  TRIAGEM: 'Em análise',
  EM_ANDAMENTO: 'Em andamento',
  EM_CAMPO: 'Em campo',
  CONCLUIDA: 'Resolvida',
  CANCELADA: 'Cancelada',
};

export default function Protocolos() {
  const navigate = useNavigate();
  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('recentes');

  useEffect(() => {
    let active = true;
    ocorrenciaService.minhas({ page: 0, size: 500, sortBy: 'dataCriacao', sortDir: 'desc' })
      .then((response) => {
        if (!active) return;
        const data = response.data?.data || response.data || {};
        setProtocolos(data.content || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Não foi possível carregar seus protocolos.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => [...new Set(protocolos
    .map((item) => item.categoriaServico)
    .filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [protocolos]);

  const visibleProtocolos = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return protocolos
      .filter((item) => {
        if (statusFilter && item.status !== statusFilter) return false;
        if (categoryFilter && item.categoriaServico !== categoryFilter) return false;
        if (!normalizedSearch) return true;
        return [item.protocolo, item.categoriaServico, item.subcategoriaServico, item.endereco, item.gps]
          .some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(normalizedSearch));
      })
      .sort((first, second) => {
        const direction = sortOrder === 'antigos' ? 1 : -1;
        return direction * (new Date(first.dataCriacao || 0) - new Date(second.dataCriacao || 0));
      });
  }, [protocolos, search, statusFilter, categoryFilter, sortOrder]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setSortOrder('recentes');
  };

  return (
    <MobileLayout title="Protocolos">
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1>Meus protocolos</h1>
            <p>{loading ? 'Carregando ocorrências…' : `${visibleProtocolos.length} de ${protocolos.length} ocorrência(s)`}</p>
          </div>
          <Link to="/app/nova-solicitacao" className={styles.newButton}>
            <Plus size={16} /> Nova ocorrência
          </Link>
        </div>

        <section className={styles.filters} aria-label="Filtros de protocolos">
          <label className={styles.searchField}>
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar protocolo, serviço ou endereço"
              aria-label="Buscar protocolos"
            />
          </label>
          <label className={styles.selectField}>
            <SlidersHorizontal size={15} aria-hidden="true" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar por status">
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className={styles.selectField}>
            <FileText size={15} aria-hidden="true" />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar por categoria">
              <option value="">Todas as categorias</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className={styles.selectField}>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Ordenar protocolos">
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </select>
          </label>
          {(search || statusFilter || categoryFilter) && (
            <button type="button" className={styles.clearButton} onClick={clearFilters}>Limpar filtros</button>
          )}
        </section>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {!loading && !error && protocolos.length === 0 && (
          <div className={styles.emptyState}>
            <FileText size={28} />
            <h2>Nenhum protocolo por aqui</h2>
            <p>Quando você registrar uma ocorrência, poderá acompanhá-la nesta lista.</p>
            <Link to="/app/nova-solicitacao" className={styles.newButton}><Plus size={16} /> Nova ocorrência</Link>
          </div>
        )}
        {!loading && !error && protocolos.length > 0 && visibleProtocolos.length === 0 && (
          <div className={styles.emptyState}>
            <Search size={26} />
            <h2>Nenhum protocolo encontrado</h2>
            <p>Altere ou limpe os filtros para ver outras ocorrências.</p>
            <button type="button" className={styles.clearButton} onClick={clearFilters}>Limpar filtros</button>
          </div>
        )}

        <div className={styles.protocolGrid}>
          {visibleProtocolos.map((item) => (
            <article className={styles.protocolCard} key={item.id}>
              <div className={styles.cardTop}>
                <div className={styles.cardTitleBlock}>
                  <span className={styles.protocolCode}>{item.protocolo}</span>
                  <StatusBadge status={item.status} />
                </div>
                <h2>{item.categoriaServico || 'Serviço'}{item.subcategoriaServico ? ` · ${item.subcategoriaServico}` : ''}</h2>
                <p className={styles.location}>{item.endereco || item.gps || 'Local não informado'}</p>
                <p className={styles.createdAt}>Registrado em {item.dataCriacao ? new Date(item.dataCriacao).toLocaleDateString('pt-BR') : '—'}</p>
              </div>
              <div className={styles.cardActions}>
                <Link to={`/app/protocolo/${item.id}`} className={styles.detailLink}>Acompanhar <ArrowRight size={15} /></Link>
                <button type="button" className={styles.copyButton}
                  onClick={() => navigate('/app/nova-solicitacao', { state: { duplicateOccurrence: item } })}>
                  <CopyPlus size={15} /> Nova semelhante
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </MobileLayout>
  );
}
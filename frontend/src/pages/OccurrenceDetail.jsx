import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, MapPin, Star } from 'lucide-react';
import { ocorrenciaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/layout/AdminLayout';
import MobileLayout from '../components/layout/MobileLayout';
import StatusBadge from '../components/ui/StatusBadge';
import styles from './OccurrenceDetail.module.css';

const RATINGS = [
  ['notaQualidade', 'Qualidade do serviço'],
  ['notaPrazos', 'Cumprimento de prazos'],
  ['notaAtendimento', 'Atendimento'],
];

export default function OccurrenceDetail() {
  const { id, protocolo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [occurrence, setOccurrence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isCitizen = user?.perfil === 'CITIZEN';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    if (!protocolo && (!id || !/^\d+$/.test(id))) {
      setError('Este link de ocorrência está incompleto. Volte ao relatório e abra o protocolo novamente.');
      setLoading(false);
      return () => { active = false; };
    }
    const request = protocolo
      ? ocorrenciaService.buscarPorProtocolo(protocolo)
      : ocorrenciaService.buscarPorId(id);
    request
      .then((response) => {
        if (active) setOccurrence(response.data?.data || response.data || null);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Não foi possível carregar esta ocorrência.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [id, protocolo]);

  const content = (
    <main className={styles.page}>
      <button type="button" className={styles.backButton} onClick={() => navigate(-1)}>
        <ArrowLeft size={17} /> Voltar
      </button>
      {loading ? <p className={styles.state}>Carregando ocorrência…</p> : error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : occurrence && (
        <>
          <header className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>Detalhe da ocorrência</p>
              <h1>{occurrence.protocolo}</h1>
              <p className={styles.category}>{occurrence.categoriaServico}{occurrence.subcategoriaServico ? ` · ${occurrence.subcategoriaServico}` : ''}</p>
            </div>
            <StatusBadge status={occurrence.status} />
          </header>

          <section className={styles.section}>
            <h2>Solicitação</h2>
            <div className={styles.meta}>
              <span><Clock3 size={15} /> Registrada em {occurrence.dataCriacao ? new Date(occurrence.dataCriacao).toLocaleString('pt-BR') : '—'}</span>
              <span><MapPin size={15} /> {occurrence.endereco || occurrence.gps || 'Localização não informada'}</span>
              {!isCitizen && <span>Registrada por {occurrence.nomeUsuario || '—'}</span>}
              {!isCitizen && <span>Equipe: {occurrence.nomeEquipe || 'Sem equipe atribuída'}</span>}
            </div>
            <p className={styles.description}>{occurrence.descricao || 'Sem descrição.'}</p>
          </section>

          <section className={styles.section}>
            <h2><Star size={17} /> Avaliação do atendimento</h2>
            {RATINGS.some(([key]) => occurrence[key] != null) ? (
              <>
                <div className={styles.ratings}>
                  {RATINGS.map(([key, label]) => (
                    <div className={styles.rating} key={key}>
                      <span>{label}</span>
                      <strong>{occurrence[key] != null ? `${occurrence[key]} / 5` : 'N/D'}</strong>
                    </div>
                  ))}
                </div>
                {occurrence.feedbackComentario && (
                  <blockquote className={styles.feedback}>{occurrence.feedbackComentario}</blockquote>
                )}
              </>
            ) : (
              <p className={styles.state}>Esta ocorrência ainda não recebeu avaliação.</p>
            )}
          </section>

          <section className={styles.section}>
            <h2>Histórico</h2>
            {occurrence.historicos?.length ? (
              <ol className={styles.history}>
                {occurrence.historicos.map((entry, index) => (
                  <li key={`${entry.data}-${index}`}>
                    <strong>{entry.acao || 'Atualização'}</strong>
                    <span>{entry.data ? new Date(entry.data).toLocaleString('pt-BR') : ''}{entry.nomeUsuario ? ` · ${entry.nomeUsuario}` : ''}</span>
                  </li>
                ))}
              </ol>
            ) : <p className={styles.state}>Nenhuma atualização registrada.</p>}
          </section>

          {isCitizen && <Link className={styles.homeLink} to="/app">Voltar ao início</Link>}
        </>
      )}
    </main>
  );

  return isCitizen
    ? <MobileLayout title="Detalhe da ocorrência">{content}</MobileLayout>
    : <AdminLayout>{content}</AdminLayout>;
}

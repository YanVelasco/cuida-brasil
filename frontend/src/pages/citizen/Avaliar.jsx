import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import Button from '../../components/ui/Button';
import { Star } from 'lucide-react';
import styles from './Avaliar.module.css';

export default function Avaliar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState({ prazos: 0, qualidade: 0, atendimento: 0 });
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!id || !/^\d+$/.test(id)) {
      setError('Não foi possível identificar a ocorrência que será avaliada.');
      setLoading(false);
      return () => { active = false; };
    }

    ocorrenciaService.buscarPorId(id)
      .then((response) => {
        if (!active) return;
        const occurrence = response.data?.data || response.data;
        setRatings({
          prazos: occurrence.notaPrazos || 0,
          qualidade: occurrence.notaQualidade || 0,
          atendimento: occurrence.notaAtendimento || 0,
        });
        const savedComment = occurrence.feedbackComentario || '';
        setComment(savedComment);
        setAlreadySubmitted(
          occurrence.notaPrazos != null
          || occurrence.notaQualidade != null
          || occurrence.notaAtendimento != null
          || Boolean(savedComment.trim())
        );
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Não foi possível carregar a ocorrência para avaliação.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [id]);

  const setRate = (k, v) => setRatings(r => ({ ...r, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (alreadySubmitted) return;
    if (!id || !/^\d+$/.test(id)) {
      setError('Não foi possível identificar a ocorrência que será avaliada.');
      return;
    }
    if (Object.values(ratings).some((rating) => rating < 1 || rating > 5)) {
      setError('Selecione uma nota de 1 a 5 estrelas para cada critério.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await ocorrenciaService.avaliar(id, { ...ratings, comentario: comment });
      const saved = response.data?.data || response.data;
      const persisted = saved?.notaPrazos === ratings.prazos
        && saved?.notaQualidade === ratings.qualidade
        && saved?.notaAtendimento === ratings.atendimento;
      if (!persisted) throw new Error('A API não confirmou a gravação das três notas. Tente novamente.');
      setSent(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Não foi possível salvar a avaliação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent || alreadySubmitted) return (
    <MobileLayout hideNav>
      <div className={styles.success}>
        <div className={styles.icon}>⭐</div>
        <h2>{sent ? 'Obrigado pela sua avaliação!' : 'Sua avaliação já foi enviada'}</h2>
        <p>
          {sent
            ? 'Seu feedback foi registrado e nos ajuda a melhorar o atendimento da equipe.'
            : 'Agradecemos sua contribuição. Seu feedback ajuda a melhorar o atendimento da equipe. Esta avaliação não pode ser editada nem enviada novamente.'}
        </p>
        <div className={styles.savedRatings} aria-label="Avaliação registrada">
          {[
            ['Cumprimento de prazos', ratings.prazos],
            ['Qualidade do serviço', ratings.qualidade],
            ['Atendimento', ratings.atendimento],
          ].map(([label, rating]) => (
            <div className={styles.savedRating} key={label}>
              <span>{label}</span>
              <div className={styles.savedStars} aria-label={`${rating} de 5 estrelas`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={18} fill={index < rating ? 'currentColor' : 'none'} />
                ))}
                <strong>{rating || 'N/D'}/5</strong>
              </div>
            </div>
          ))}
        </div>
        {comment.trim() && <blockquote className={styles.savedComment}>{comment}</blockquote>}
        <Button onClick={() => navigate('/app')}>VOLTAR AO INÍCIO</Button>
      </div>
    </MobileLayout>
  );

  return (
    <MobileLayout>
      <div className={styles.header}>
        <h1>Avaliar Atendimento</h1>
        <p>Como você avalia o serviço prestado?</p>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        {loading ? <p role="status">Carregando ocorrência…</p> : [['prazos','Cumprimento de Prazos'], ['qualidade','Qualidade do Serviço'], ['atendimento','Atendimento']].map(([k, label]) => (
          <div key={k} className={styles.rateItem}>
            <p>{label}</p>
            <div className={styles.stars}>
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setRate(k, n)}
                  className={[styles.star, ratings[k] >= n ? styles.starActive : ''].join(' ')}
                  aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'} para ${label}`} aria-pressed={ratings[k] === n}>
                  <Star size={28} fill={ratings[k] >= n ? '#f59e0b' : 'none'}/>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className={styles.field}>
          <label>Comentários (opcional)</label>
          <textarea className={styles.textarea} rows={3} placeholder="Conte-nos mais..." value={comment} onChange={e => setComment(e.target.value)}/>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <Button type="submit" fullWidth disabled={loading || submitting}>
          {submitting ? 'SALVANDO…' : 'ENVIAR AVALIAÇÃO'}
        </Button>
      </form>
    </MobileLayout>
  );
}

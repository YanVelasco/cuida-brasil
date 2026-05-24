import { useState } from 'react';
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

  const setRate = (k, v) => setRatings(r => ({ ...r, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await ocorrenciaService.avaliar(id ?? 1, { ...ratings, comentario: comment });
    } catch {}
    setSent(true);
    setTimeout(() => navigate('/app'), 2000);
  };

  if (sent) return (
    <MobileLayout hideNav>
      <div className={styles.success}>
        <div className={styles.icon}>⭐</div>
        <h2>Avaliação Enviada!</h2>
        <p>Obrigado pelo seu feedback. Ele nos ajuda a melhorar!</p>
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
        {[['prazos','Cumprimento de Prazos'], ['qualidade','Qualidade do Serviço'], ['atendimento','Atendimento']].map(([k, label]) => (
          <div key={k} className={styles.rateItem}>
            <p>{label}</p>
            <div className={styles.stars}>
              {[1,2,3,4,5].map(n => (
                <button type="button" key={n} onClick={() => setRate(k, n)}
                  className={[styles.star, ratings[k] >= n ? styles.starActive : ''].join(' ')}>
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
        <Button type="submit" fullWidth>ENVIAR AVALIAÇÃO</Button>
      </form>
    </MobileLayout>
  );
}

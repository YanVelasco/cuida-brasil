import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import { ChevronLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import styles from './Protocolo.module.css';

const MOCK_HIST = [
  { titulo: 'Ocorrência registrada', data: '10/05/2024 09:00', done: true },
  { titulo: 'Em análise pela prefeitura', data: '10/05/2024 14:00', done: true },
  { titulo: 'Equipe designada', data: '11/05/2024 08:00', done: true },
  { titulo: 'Em atendimento', data: '12/05/2024 10:00', done: false },
  { titulo: 'Concluída', data: '', done: false },
];

const MOCK_OC = { id: 1, titulo: 'Buraco na Rua ABC', categoria: 'Infraestrutura', status: 'em_andamento', protocolo: 'PRO-2024-001', data: '10/05/2024', local: 'Rua ABC, 123 - Centro', descricao: 'Grande buraco na via, oferece risco aos veículos e pedestres.' };

export default function Protocolo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oc, setOc] = useState(MOCK_OC);

  useEffect(() => {
    if (id) ocorrenciaService.buscarPorId(id).then(r => setOc(r.data)).catch(()=>{});
  }, [id]);

  return (
    <MobileLayout>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}><ChevronLeft size={22}/></button>
        <h1>Acompanhar</h1>
      </div>

      <div className={styles.protBox}>
        <div className={styles.protCode}>{oc.protocolo ?? '#XXXXXXX'}</div>
        <StatusBadge status={oc.status}/>
      </div>

      <div className={styles.infoCard}>
        <h3>{oc.titulo}</h3>
        <p className={styles.sub}>{oc.local}</p>
        <span className={styles.cat}>{oc.categoria}</span>
        <p className={styles.desc}>{oc.descricao}</p>
        <p className={styles.date}><Clock size={13}/> Registrada em {oc.data}</p>
      </div>

      <div className={styles.histSection}>
        <h3>Histórico</h3>
        <div className={styles.timeline}>
          {MOCK_HIST.map((h, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={[styles.dot, h.done ? styles.dotDone : ''].join(' ')}>
                {h.done ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
              </div>
              <div className={styles.timelineContent}>
                <p className={[styles.tlTitle, h.done ? styles.tlDone : ''].join(' ')}>{h.titulo}</p>
                {h.data && <p className={styles.tlDate}>{h.data}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}

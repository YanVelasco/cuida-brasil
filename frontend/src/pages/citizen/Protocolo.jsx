import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import { ChevronLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import styles from './Protocolo.module.css';

export default function Protocolo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oc, setOc] = useState({});

  useEffect(() => {
    if (id) {
      ocorrenciaService.buscarPorId(id).then(r => {
        const ocData = r.data?.data || r.data;
        setOc(ocData);
      }).catch(()=>{});
    }
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
        <h3>{oc.subcategoriaServico || oc.titulo}</h3>
        <p className={styles.sub}>{oc.endereco || oc.gps || oc.local}</p>
        <span className={styles.cat}>{oc.categoriaServico || oc.categoria}</span>
        <p className={styles.desc}>{oc.descricao}</p>
        <p className={styles.date}><Clock size={13}/> Registrada em {oc.dataCriacao ? new Date(oc.dataCriacao).toLocaleDateString() : oc.data}</p>
        
        {oc.status?.toUpperCase() === 'CONCLUIDA' && (
          <button 
            onClick={() => navigate(`/app/avaliar/${oc.id}`)} 
            className={styles.avaliarBtn}
          >
            Avaliar Atendimento
          </button>
        )}
      </div>


      <div className={styles.histSection}>
        <h3>Histórico</h3>
        <div className={styles.timeline}>
          {oc.historicos && oc.historicos.length > 0 ? (
            oc.historicos.map((h, i) => {
              const isDone = true;
              const title = h.acao || h.observacao || 'Atualização do status';
              const dateStr = h.data ? new Date(h.data).toLocaleString() : '';

              return (
                <div key={i} className={styles.timelineItem}>
                  <div className={[styles.dot, isDone ? styles.dotDone : ''].join(' ')}>
                    {isDone ? <CheckCircle2 size={18}/> : <Circle size={18}/>}
                  </div>
                  <div className={styles.timelineContent}>
                    <p className={[styles.tlTitle, isDone ? styles.tlDone : ''].join(' ')}>{title}</p>
                    {dateStr && <p className={styles.tlDate}>{dateStr}</p>}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: 'var(--text-muted)', marginTop: '12px' }}>Ainda não há histórico desta solicitação.</p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

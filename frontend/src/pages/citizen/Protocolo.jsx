import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ocorrenciaService, anexoService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import { ChevronLeft, CheckCircle2, Circle, Clock, Paperclip, Download } from 'lucide-react';
import styles from './Protocolo.module.css';

export default function Protocolo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oc, setOc] = useState({});
  const [anexos, setAnexos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const loadAnexos = () => {
    if (!id) return;
    anexoService.listar(id)
      .then(r => setAnexos(r.data?.data || r.data || []))
      .catch(() => setAnexos([]));
  };

  useEffect(() => {
    if (id) {
      ocorrenciaService.buscarPorId(id).then(r => {
        const ocData = r.data?.data || r.data;
        setOc(ocData);
      }).catch(()=>{});
      loadAnexos();
    }
  }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setUploadError('');
    try {
      await anexoService.upload(id, file);
      loadAnexos();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Erro ao enviar anexo.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async (anexo) => {
    try {
      const response = await anexoService.download(anexo.id);
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo.arquivo;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao baixar anexo.');
    }
  };

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
        <h3><Paperclip size={15} style={{verticalAlign: 'middle', marginRight: 4}}/>Anexos</h3>
        {anexos.length > 0 ? (
          anexos.map((a) => (
            <div key={a.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8}}>
              <div style={{minWidth: 0}}>
                <p style={{fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{a.arquivo}</p>
                <p style={{fontSize: '0.72rem', color: 'var(--text-muted)'}}>
                  {a.autor ? `por ${a.autor} — ` : ''}{a.data ? new Date(a.data).toLocaleString('pt-BR') : ''}
                </p>
              </div>
              <button onClick={() => handleDownload(a)} title="Baixar anexo"
                style={{background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--primary, #1351B4)', flexShrink: 0, display: 'flex'}}>
                <Download size={16}/>
              </button>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '0.85rem' }}>Nenhum anexo enviado ainda.</p>
        )}
        <label style={{display: 'block', marginTop: 12, padding: '12px', border: '2px dashed var(--border)', borderRadius: 8, textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', fontSize: '0.85rem', color: 'var(--primary, #1351B4)', fontWeight: 600}}>
          <input type="file" accept="image/*,.pdf,.mp4" onChange={handleUpload} disabled={uploading} style={{display: 'none'}}/>
          {uploading ? 'Enviando...' : '+ Adicionar anexo (foto, PDF ou vídeo)'}
        </label>
        {uploadError && <p style={{color: '#EB5757', fontSize: '0.8rem', marginTop: 6}}>{uploadError}</p>}
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

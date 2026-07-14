import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ocorrenciaService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MapPin, Tag, FileText, ChevronLeft } from 'lucide-react';
import styles from './NovaSolicitacao.module.css';

const CATEGORIAS = ['Infraestrutura','Iluminação Pública','Limpeza Urbana','Parques e Jardins','Saneamento','Segurança Pública','Outros'];

export default function NovaSolicitacao() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ titulo:'', categoria:'', descricao:'', gps:'', idServico: 1 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locStatus, setLocStatus] = useState('Buscando localização...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setForm(f => ({ ...f, gps: `${lat}, ${lng}` }));
          setLocStatus(`Localização capturada: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        },
        (err) => {
          console.error("Erro ao obter geolocalização:", err);
          setLocStatus('Falha ao obter localização. Verifique as permissões.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocStatus('Geolocalização não suportada neste dispositivo.');
    }
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await ocorrenciaService.criar(form);
      setSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch { setError('Erro ao registrar ocorrência. Tente novamente.'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <MobileLayout hideNav>
      <div className={styles.success}>
        <div className={styles.successIcon}>✓</div>
        <h2>Ocorrência Registrada!</h2>
        <p>Seu protocolo foi gerado. Você pode acompanhar o status na tela inicial.</p>
      </div>
    </MobileLayout>
  );

  return (
    <MobileLayout hideNav>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}><ChevronLeft size={22}/></button>
        <h1>Nova Ocorrência</h1>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input id="titulo" label="Título" placeholder="Descreva brevemente o problema" value={form.titulo} onChange={set('titulo')} icon={<FileText size={16}/>} required/>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoria">Categoria</label>
          <div className={styles.selectWrap}><Tag size={16} className={styles.selIcon}/>
            <select id="categoria" className={styles.select} value={form.categoria} onChange={set('categoria')} required>
              <option value="">Selecione a categoria</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="descricao">Descrição</label>
          <textarea id="descricao" className={styles.textarea} placeholder="Descreva o problema com mais detalhes..." value={form.descricao} onChange={set('descricao')} rows={4} required/>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Localização (Automática)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <MapPin size={18} style={{ color: form.gps ? 'var(--success)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', color: form.gps ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {locStatus}
            </span>
          </div>
        </div>

        <div className={styles.mapPlaceholder}>
          <MapPin size={24} style={{ color: form.gps ? 'var(--success)' : 'inherit' }}/>
          <p>{form.gps ? 'Localização atual capturada no mapa' : 'Aguardando localização...'}</p>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" fullWidth size="lg" disabled={loading}>{loading ? 'Enviando...' : 'ENVIAR OCORRÊNCIA'}</Button>
      </form>
    </MobileLayout>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ocorrenciaService, servicoService } from '../../services/api';
import MobileLayout from '../../components/layout/MobileLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { MapPin, Tag, FileText, ChevronLeft, Camera, Image as ImageIcon, X } from 'lucide-react';
import styles from './NovaSolicitacao.module.css';

export default function NovaSolicitacao() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ titulo:'', idServico:'', descricao:'', gps:'', endereco:'', fotos:'' });
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [locStatus, setLocStatus] = useState('Buscando localização...');

  useEffect(() => {
    servicoService.listar()
      .then(r => setServicos(r.data?.data || r.data || []))
      .catch(err => console.error('Erro ao buscar serviços:', err));

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setForm(f => ({ ...f, gps: `${lat}, ${lng}` }));
          setLocStatus(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          
          // Reverse Geocoding via Nominatim
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
              if (data && data.display_name) {
                const address = data.address;
                const road = address.road || '';
                const suburb = address.suburb || address.neighbourhood || '';
                const shortAddress = road ? `${road}${suburb ? ' - ' + suburb : ''}` : data.display_name.split(',').slice(0, 2).join(',');
                setForm(f => ({ ...f, endereco: shortAddress }));
                setLocStatus(shortAddress);
              }
            })
            .catch(err => console.error('Erro na geocodificação', err));
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

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Compress and convert to Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        } else if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setForm(f => ({ ...f, fotos: dataUrl }));
      };
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await ocorrenciaService.criar(form);
      setSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) { 
      const msg = err.response?.data?.message || 'Erro ao registrar ocorrência. Tente novamente.';
      setError(msg); 
    }
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
          <label className={styles.label} htmlFor="idServico">Categoria do Problema</label>
          <div className={styles.selectWrap}><Tag size={16} className={styles.selIcon}/>
            <select id="idServico" className={styles.select} value={form.idServico} onChange={set('idServico')} required>
              <option value="">Selecione o tipo de problema...</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.categoria} — {s.subcategoria}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="descricao">Descrição</label>
          <textarea id="descricao" className={styles.textarea} placeholder="Descreva o problema com mais detalhes..." value={form.descricao} onChange={set('descricao')} rows={4} required/>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Foto da Ocorrência</label>
          <div className={styles.photoContainer}>
            {form.fotos ? (
              <div className={styles.photoPreview}>
                <img src={form.fotos} alt="Ocorrência" />
                <button type="button" className={styles.removePhoto} onClick={() => setForm(f => ({...f, fotos: ''}))}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={styles.photoUpload}>
                <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} style={{ display: 'none' }} />
                <Camera size={32} className={styles.cameraIcon} />
                <span>Tirar Foto ou Escolher Arquivo</span>
              </label>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Coordenadas de GPS</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <MapPin size={18} style={{ color: form.gps ? 'var(--success)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', color: form.gps ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {locStatus}
            </span>
          </div>
        </div>

        <Input 
          id="endereco" 
          label="Endereço da Ocorrência" 
          placeholder="Rua, Bairro, Cidade (Automático ou digite manualmente...)" 
          value={form.endereco} 
          onChange={set('endereco')} 
          icon={<MapPin size={16}/>} 
          required 
        />

        {error && <p className={styles.error}>{error}</p>}
        <Button type="submit" fullWidth size="lg" disabled={loading}>{loading ? 'Enviando...' : 'ENVIAR OCORRÊNCIA'}</Button>
      </form>
    </MobileLayout>
  );
}

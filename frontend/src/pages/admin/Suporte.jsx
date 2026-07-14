import { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LifeBuoy, Send, MessageSquareWarning } from 'lucide-react';
import styles from './Suporte.module.css';

export default function Suporte() {
  const [form, setForm] = useState({ assunto: '', descricao: '', tipo: 'BUG' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simula o envio para o backend
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setForm({ assunto: '', descricao: '', tipo: 'BUG' });
    }, 1500);
  };

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Suporte Técnico (TI)</h1>
          <p className={styles.pageSub}>Relate instabilidades, bugs ou solicite ajuda aos administradores do sistema.</p>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.formCard}>
          {success ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h2>Chamado Enviado!</h2>
              <p>A equipe de Administração e TI recebeu sua solicitação e entrará em contato em breve.</p>
              <Button onClick={() => setSuccess(false)} style={{marginTop: '20px'}}>Abrir novo chamado</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tipo de Problema</label>
                <select 
                  className={styles.select}
                  value={form.tipo}
                  onChange={(e) => setForm({...form, tipo: e.target.value})}
                  required
                >
                  <option value="BUG">Erro no Sistema (Bug)</option>
                  <option value="INSTABILITY">Instabilidade / Lentidão</option>
                  <option value="ACCESS">Problema de Acesso</option>
                  <option value="OTHER">Outros / Dúvida</option>
                </select>
              </div>

              <Input 
                id="assunto" 
                label="Assunto Breve" 
                placeholder="Ex: Não consigo visualizar as novas equipes" 
                value={form.assunto} 
                onChange={(e) => setForm({...form, assunto: e.target.value})}
                icon={<MessageSquareWarning size={16}/>} 
                required
              />

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Descrição Detalhada</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Descreva o que aconteceu, a hora do erro e se há alguma mensagem aparecendo na tela..." 
                  value={form.descricao} 
                  onChange={(e) => setForm({...form, descricao: e.target.value})}
                  rows={5} 
                  required
                />
              </div>

              <Button type="submit" size="lg" disabled={loading} style={{marginTop: '10px'}}>
                {loading ? 'Enviando...' : <><Send size={16} style={{marginRight: '8px'}}/> Enviar para a TI</>}
              </Button>
            </form>
          )}
        </div>

        <div className={styles.infoCard}>
          <div className={styles.infoIconWrapper}>
            <LifeBuoy size={32} />
          </div>
          <h3>Central de Ajuda</h3>
          <p>Este canal é exclusivo para gestores reportarem falhas sistêmicas diretamente à equipe de Tecnologia (Administradores do Sistema).</p>
          
          <ul className={styles.infoList}>
            <li><strong>SLA de Resposta:</strong> Até 4 horas úteis</li>
            <li><strong>Contato de Emergência:</strong> (11) 9999-9999</li>
            <li><strong>E-mail:</strong> ti@cuidarbrasil.gov.br</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

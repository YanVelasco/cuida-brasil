import { useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import { orgaoService } from '../../services/api';
import styles from './Dashboard.module.css';

const emptyForm = { nome: '', sigla: '', tipo: '', areaAtendimento: '' };
const emptyAdminForm = { nome: '', cpf: '', email: '', senha: '' };

export default function Orgaos() {
  const [orgaos, setOrgaos] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [adminOrgao, setAdminOrgao] = useState(null);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [administradores, setAdministradores] = useState([]);
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [mostrarFormAdmin, setMostrarFormAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregarOrgaos = async () => {
    setLoading(true);
    try {
      const response = await orgaoService.listar();
      setOrgaos(response.data?.data || []);
    } catch (error) {
      console.error('Erro ao carregar órgãos:', error);
      alert('Não foi possível carregar os órgãos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrgaos();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const requiredFields = ['nome', 'sigla', 'tipo', 'areaAtendimento'];
    if (requiredFields.some((field) => !form[field].trim())) {
      alert('Preencha todos os campos do órgão.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await orgaoService.atualizar(editingId, form);
      } else {
        await orgaoService.criar(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await carregarOrgaos();
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível cadastrar o órgão.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const editarOrgao = (orgao) => {
    setEditingId(orgao.id);
    setForm({
      nome: orgao.nome || '',
      sigla: orgao.sigla || '',
      tipo: orgao.tipo || '',
      areaAtendimento: orgao.areaAtendimento || '',
    });
  };

  const excluirOrgao = async (orgao) => {
    if (!window.confirm(`Desativar o órgão ${orgao.nome}? Equipes e históricos vinculados serão preservados.`)) return;
    try {
      await orgaoService.excluir(orgao.id);
      if (editingId === orgao.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await carregarOrgaos();
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível desativar o órgão.');
    }
  };

  const salvarAdministrador = async (event) => {
    event.preventDefault();
    const adminRequired = editingAdminId ? ['nome', 'cpf', 'email'] : ['nome', 'cpf', 'email', 'senha'];
    if (adminRequired.some((field) => !adminForm[field].trim())) {
      alert('Preencha todos os dados do administrador.');
      return;
    }
    try {
      if (editingAdminId) {
        await orgaoService.atualizarAdministrador(adminOrgao.id, editingAdminId, adminForm);
        alert('Administrador atualizado com sucesso.');
      } else {
        await orgaoService.criarAdministrador(adminOrgao.id, adminForm);
        alert('Administrador do órgão criado com sucesso.');
      }
      const response = await orgaoService.listarAdministradores(adminOrgao.id);
      setAdministradores(response.data?.data || []);
      setEditingAdminId(null);
      setAdminForm(emptyAdminForm);
      setMostrarFormAdmin(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível criar o administrador.');
    }
  };

  const editarAdministrador = (admin) => {
    setEditingAdminId(admin.id);
    setAdminForm({ nome: admin.nome || '', cpf: admin.cpf || '', email: admin.email || '', senha: '' });
    setMostrarFormAdmin(true);
  };

  const excluirAdministrador = async (admin) => {
    if (!window.confirm(`Desativar o administrador ${admin.nome}? O histórico de auditoria será preservado.`)) return;
    try {
      await orgaoService.excluirAdministrador(adminOrgao.id, admin.id);
      const response = await orgaoService.listarAdministradores(adminOrgao.id);
      setAdministradores(response.data?.data || []);
      setEditingAdminId(null);
      setAdminForm(emptyAdminForm);
      setMostrarFormAdmin(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível desativar o administrador.');
    }
  };

  const abrirAdministradores = async (orgao) => {
    try {
      const response = await orgaoService.listarAdministradores(orgao.id);
      setAdminOrgao(orgao);
      setAdministradores(response.data?.data || []);
      setEditingAdminId(null);
      setAdminForm(emptyAdminForm);
    } catch (error) {
      alert(error.response?.data?.message || 'Não foi possível carregar os administradores.');
    }
  };

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Órgãos Públicos</h1>
          <p className={styles.pageSub}>Cadastro e visão geral dos órgãos integrados</p>
        </div>
        <button type="button" className={styles.exportBtn} onClick={carregarOrgaos} title="Atualizar lista">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 16, alignItems: 'start' }}>
        <form onSubmit={handleSubmit} className={styles.modernCard} style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Building2 size={20} color="var(--primary)" />
            <strong>{editingId ? 'Editar órgão' : 'Novo órgão'}</strong>
          </div>
          {[
            ['nome', 'Nome'],
            ['sigla', 'Sigla'],
            ['tipo', 'Tipo'],
            ['areaAtendimento', 'Área de atendimento'],
          ].map(([field, label]) => (
            <label key={field} style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {label}
              <input value={form[field]} onChange={updateField(field)} className={styles.searchInput} />
            </label>
          ))}
          <button type="submit" className={styles.newBtn} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Cadastrar órgão'}
          </button>
          {editingId && <button type="button" className={styles.clearBtn} onClick={() => { setEditingId(null); setForm(emptyForm); }} style={{ marginLeft: 8 }}>Cancelar edição</button>}
        </form>

        <div className={styles.modernCard} style={{ padding: 18, overflowX: 'auto' }}>
          <div className={styles.statLabel}>ÓRGÃOS CADASTRADOS</div>
          {loading ? <p>Carregando...</p> : (
            <table className={styles.table}>
              <thead><tr><th>NOME</th><th>SIGLA</th><th>TIPO</th><th>ÁREA DE ATENDIMENTO</th><th>MEMBROS</th><th>AÇÕES</th></tr></thead>
              <tbody>
                {orgaos.map((orgao) => (
                  <tr key={orgao.id}>
                    <td>{orgao.nome}</td><td>{orgao.sigla}</td><td>{orgao.tipo}</td><td>{orgao.areaAtendimento}</td>
                    <td><button type="button" className={styles.clearBtn} onClick={() => abrirAdministradores(orgao)}>{orgao.membros ?? 0}</button></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className={styles.newBtn} onClick={() => abrirAdministradores(orgao)} title="Gerenciar administradores do órgão" style={{ marginRight: 6, padding: '5px 9px', fontSize: '0.72rem' }}>Admin</button>
                      <button type="button" className={styles.clearBtn} onClick={() => editarOrgao(orgao)} title="Editar órgão" style={{ marginRight: 6 }}><Pencil size={14} /></button>
                      <button type="button" className={styles.clearBtn} onClick={() => excluirOrgao(orgao)} title="Desativar órgão"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
                {!orgaos.length && <tr><td colSpan="6">Nenhum órgão cadastrado.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {adminOrgao && <div className={styles.modalOverlay}>
        <form onSubmit={salvarAdministrador} className={styles.modalContent} style={{ maxWidth: 420 }}>
          <h3>Administradores de {adminOrgao.sigla}</h3>
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 14 }}>
            {administradores.length ? administradores.map((admin) => <div key={admin.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span><strong>{admin.nome}</strong><br /><small>{admin.email}</small></span>
              <span style={{ display: 'flex', gap: 6 }}>
                <button type="button" className={styles.clearBtn} onClick={() => editarAdministrador(admin)}>Editar</button>
                <button type="button" className={styles.clearBtn} onClick={() => excluirAdministrador(admin)}>Excluir</button>
              </span>
            </div>) : <p style={{ color: 'var(--text-muted)' }}>Nenhum administrador cadastrado.</p>}
          </div>
          {!mostrarFormAdmin && <button type="button" className={styles.newBtn} onClick={() => { setEditingAdminId(null); setAdminForm(emptyAdminForm); setMostrarFormAdmin(true); }} style={{ marginBottom: 12 }}><Plus size={15} /> Novo administrador</button>}
          {mostrarFormAdmin && <>
          <h4>{editingAdminId ? 'Editar administrador' : 'Novo administrador'}</h4>
          {[
            ['nome', 'Nome completo'],
            ['cpf', 'CPF'],
            ['email', 'E-mail'],
          ].map(([field, label]) => <label key={field} style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {label}<input value={adminForm[field]} onChange={(event) => setAdminForm((current) => ({ ...current, [field]: event.target.value }))} className={styles.searchInput} />
          </label>)}
          <label style={{ display: 'grid', gap: 5, marginBottom: 12, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Senha<input type="password" value={adminForm.senha} onChange={(event) => setAdminForm((current) => ({ ...current, senha: event.target.value }))} className={styles.searchInput} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}><button type="submit" className={styles.newBtn}>{editingAdminId ? 'Salvar alterações' : 'Criar administrador'}</button><button type="button" className={styles.clearBtn} onClick={() => { setMostrarFormAdmin(false); setEditingAdminId(null); setAdminForm(emptyAdminForm); }}>Cancelar</button></div>
          </>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}><button type="button" className={styles.clearBtn} onClick={() => setAdminOrgao(null)}>Fechar</button></div>
        </form>
      </div>}
    </AdminLayout>
  );
}

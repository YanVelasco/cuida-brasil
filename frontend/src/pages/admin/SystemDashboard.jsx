import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { dashboardService, auditoriaService } from '../../services/api';
import { orgaoService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, ShieldCheck, Map, Activity, Cpu, KeyRound, FileDown, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import styles from './Dashboard.module.css';

const AUDIT_COLUMNS = ['Data/Hora', 'Ação', 'Usuário', 'Órgão', 'CPF', 'IP', 'Resultado', 'Detalhes'];

function formatCpf(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

function formatIp(value) {
  const raw = value.replace(/[^0-9a-fA-F]/g, '').slice(0, 32);
  if (/[a-fA-F]/.test(raw) || raw.length > 12) {
    return raw.match(/.{1,4}/g)?.join(':') || '';
  }
  return raw.match(/\d{1,3}/g)?.join('.') || '';
}

function normalizeIp(value) {
  return value.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
}

function auditRowToArray(l) {
  return [
    l.data ? new Date(l.data).toLocaleString('pt-BR') : '—',
    l.acao || '—',
    l.usuario || '—',
    l.orgao || '—',
    l.cpf || '—',
    l.ip || '—',
    l.sucesso ? 'SUCESSO' : 'FALHA',
    l.detalhes || '—',
  ];
}

async function fetchAuditoriaCompleta() {
  const res = await auditoriaService.listar({ page: 0, size: 1000 });
  const pageData = res.data?.data || res.data || {};
  return pageData.content || [];
}

export default function SystemDashboard() {
  const { user } = useAuth();
  const isGlobalAdmin = user?.perfil === 'GLOBAL_ADMIN';
  const [stats, setStats] = useState({ totalGestores: 0, totalUsuarios: 0, totalEquipes: 0 });
  const [orgaos, setOrgaos] = useState([]);
  const [logins, setLogins] = useState([]);
  const [loginPage, setLoginPage] = useState(0);
  const [loginTotalPages, setLoginTotalPages] = useState(1);
  const [loginStatus, setLoginStatus] = useState('');
  const [loginCpf, setLoginCpf] = useState('');
  const [loginUsuario, setLoginUsuario] = useState('');
  const [loginDetalhes, setLoginDetalhes] = useState('');
  const [loginIp, setLoginIp] = useState('');
  const [loginDataInicio, setLoginDataInicio] = useState('');
  const [loginDataFim, setLoginDataFim] = useState('');
  const [loginOrgao, setLoginOrgao] = useState('');
  const [loginError, setLoginError] = useState('');
  const [resumoLogins, setResumoLogins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const hasLoginFilters = Boolean(loginStatus || loginCpf || loginUsuario || loginDetalhes || loginIp || loginDataInicio || loginDataFim || (isGlobalAdmin && loginOrgao));

  const exportAuditoriaExcel = async () => {
    setExporting(true);
    try {
      const registros = await fetchAuditoriaCompleta();
      const wb = XLSX.utils.book_new();

      const toSheet = (rows) => {
        const ws = XLSX.utils.aoa_to_sheet([AUDIT_COLUMNS, ...rows.map(auditRowToArray)]);
        ws['!cols'] = [{ wch: 20 }, { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 50 }];
        return ws;
      };

      XLSX.utils.book_append_sheet(wb, toSheet(registros), 'Auditoria Completa');
      XLSX.utils.book_append_sheet(wb, toSheet(registros.filter((r) => String(r.acao || '').startsWith('LOGIN'))), 'Logins Auditados');
      XLSX.writeFile(wb, `auditoria-cuidar-brasil-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error('Erro ao exportar auditoria para Excel:', error);
      alert('Não foi possível exportar a auditoria para Excel.');
    } finally {
      setExporting(false);
    }
  };

  const exportAuditoriaPDF = async () => {
    setExporting(true);
    try {
      const registros = await fetchAuditoriaCompleta();
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(19, 81, 180);
      doc.rect(0, 0, pageWidth, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text('Cuidar+Brasil — Trilha de Auditoria Corporativa', 14, 11);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · ${registros.length} registro(s)`, 14, 18);

      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      const sucesso = resumoLogins?.sucesso ?? registros.filter((r) => r.sucesso).length;
      const falha = resumoLogins?.falha ?? registros.filter((r) => !r.sucesso).length;
      doc.text(`Logins com sucesso: ${sucesso}    ·    Tentativas falhas: ${falha}`, 14, 32);

      autoTable(doc, {
        startY: 37,
        head: [AUDIT_COLUMNS],
        body: registros.map(auditRowToArray),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [19, 81, 180], fontSize: 8 },
        alternateRowStyles: { fillColor: [244, 247, 252] },
        columnStyles: { 6: { cellWidth: 70 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            data.cell.styles.textColor = data.cell.raw === 'SUCESSO' ? [39, 174, 96] : [235, 87, 87];
            data.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: () => {
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Cuidar+Brasil GovTech — documento de auditoria · Página ${doc.internal.getNumberOfPages()}`,
            14,
            doc.internal.pageSize.getHeight() - 6
          );
        },
      });

      doc.save(`auditoria-cuidar-brasil-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar auditoria para PDF:', error);
      alert('Não foi possível exportar a auditoria para PDF.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsResponse, loginsResponse, resumoResponse, orgaosResponse] = await Promise.allSettled([
          dashboardService.statsAdmin(),
          auditoriaService.listar({
            acao: 'LOGIN',
            page: hasLoginFilters ? 0 : loginPage,
            size: hasLoginFilters ? 1000 : 8,
          }),
          auditoriaService.resumoLogins(),
          orgaoService.listar(),
        ]);

        if (statsResponse.status === 'fulfilled') {
          setStats(statsResponse.value.data.data || statsResponse.value.data || {});
        }

        if (loginsResponse.status === 'fulfilled') {
          setLoginError('');
          const pageData = loginsResponse.value.data?.data || loginsResponse.value.data || {};
          const allLogins = pageData.content || [];
          if (hasLoginFilters) {
            const selectedOrgao = orgaos.find((orgao) => String(orgao.id) === loginOrgao);
            const filtered = allLogins.filter((login) => {
              const date = login.data ? new Date(login.data).toISOString().slice(0, 10) : '';
              return (!loginStatus || String(Boolean(login.sucesso)) === loginStatus)
                && (!loginCpf || String(login.cpf || '').toLowerCase().includes(loginCpf.toLowerCase()))
                && (!loginUsuario || String(login.usuario || '').toLowerCase().includes(loginUsuario.toLowerCase()))
                && (!loginDetalhes || String(login.detalhes || '').toLowerCase().includes(loginDetalhes.toLowerCase()))
                && (!loginIp || normalizeIp(login.ip || '').includes(normalizeIp(loginIp)))
                && (!loginOrgao || String(login.orgaoId || '') === loginOrgao || login.orgao === selectedOrgao?.nome)
                && (!loginDataInicio || date >= loginDataInicio)
                && (!loginDataFim || date <= loginDataFim);
            });
            const first = loginPage * 8;
            setLogins(filtered.slice(first, first + 8));
            setLoginTotalPages(Math.max(1, Math.ceil(filtered.length / 8)));
          } else {
            setLogins(allLogins);
            setLoginTotalPages(pageData.totalPages || 1);
          }
        } else {
          setLogins([]);
          setLoginError('Não foi possível carregar os acessos auditados.');
        }
        if (resumoResponse.status === 'fulfilled') {
          setResumoLogins(resumoResponse.value.data?.data || resumoResponse.value.data);
        }
        if (orgaosResponse?.status === 'fulfilled') {
          const orgaosAtivos = (orgaosResponse.value.data?.data || []).filter((orgao) => orgao.ativo !== false);
          setOrgaos(orgaosAtivos);
          if (!isGlobalAdmin && orgaosAtivos.length === 1) {
            setLoginOrgao(String(orgaosAtivos[0].id));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard admin:', error);
        setStats({ totalGestores: 0, totalUsuarios: 0, totalEquipes: 0 });
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [isGlobalAdmin, loginPage, loginStatus, loginCpf, loginUsuario, loginDetalhes, loginIp, loginDataInicio, loginDataFim, loginOrgao, hasLoginFilters]);

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>{isGlobalAdmin ? 'Dashboard Global' : 'Dashboard Executivo'}</h1>
          <p style={{color: 'var(--text-muted)'}}>{isGlobalAdmin ? 'Órgãos cadastrados e acessos globais auditados' : 'Visão executiva do sistema — indicadores nacionais e auditoria'}</p>
        </div>
      </div>

      {loading ? (
        <div style={{padding: '2rem', display: 'flex', justifyContent: 'center'}}>
          <Activity size={32} className={styles.spin} style={{color: 'var(--primary)'}} />
        </div>
      ) : (
        <>
          {isGlobalAdmin ? (
            <>
              <div className={styles.stats} style={{ gridTemplateColumns: 'minmax(220px, 1fr)' }}>
                <div className={styles.modernCard}>
                  <div className={styles.modernCardHeader}>
                    <div className={styles.modernCardIcon} style={{background: 'rgba(47, 128, 237, 0.1)', color: '#2F80ED'}}>
                      <Map size={24}/>
                    </div>
                    <span className={styles.trend}>Cadastro global</span>
                  </div>
                  <div className={styles.statLabel}>ÓRGÃOS CADASTRADOS</div>
                  <div className={styles.modernCardValue}>{orgaos.length.toLocaleString()}</div>
                </div>
              </div>
              <div className={styles.chartCard} style={{ marginTop: '20px' }}>
                <h3 className={styles.chartTitle}>Órgãos Públicos Cadastrados</h3>
                <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead><tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px' }}>NOME</th><th style={{ padding: '8px' }}>SIGLA</th><th style={{ padding: '8px' }}>TIPO</th><th style={{ padding: '8px' }}>ÁREA DE ATENDIMENTO</th>
                    </tr></thead>
                    <tbody>
                      {orgaos.map((orgao) => <tr key={orgao.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{orgao.nome}</td><td style={{ padding: '8px' }}>{orgao.sigla}</td><td style={{ padding: '8px' }}>{orgao.tipo}</td><td style={{ padding: '8px' }}>{orgao.areaAtendimento}</td>
                      </tr>)}
                      {!orgaos.length && <tr><td colSpan="4" style={{ padding: '12px', color: 'var(--text-muted)' }}>Nenhum órgão cadastrado.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
          <div className={styles.stats}>
            <div className={styles.modernCard}>
              <div className={styles.modernCardHeader}>
                <div className={styles.modernCardIcon} style={{background: 'rgba(39, 174, 96, 0.1)', color: '#27AE60'}}>
                  <ShieldCheck size={24}/>
                </div>
                <span className={styles.trend}>Tempo real</span>
              </div>
              <div className={styles.statLabel}>GESTORES CADASTRADOS</div>
              <div className={styles.modernCardValue}>{stats.totalGestores.toLocaleString()}</div>
            </div>
            
            <div className={styles.modernCard}>
              <div className={styles.modernCardHeader}>
                <div className={styles.modernCardIcon} style={{background: 'rgba(47, 128, 237, 0.1)', color: '#2F80ED'}}>
                  <Users size={24}/>
                </div>
                <span className={styles.trend}>Tempo real</span>
              </div>
              <div className={styles.statLabel}>USUÁRIOS ATIVOS</div>
              <div className={styles.modernCardValue}>{stats.totalUsuarios.toLocaleString()}</div>
            </div>
            
            <div className={styles.modernCard}>
              <div className={styles.modernCardHeader}>
                <div className={styles.modernCardIcon} style={{background: 'rgba(242, 201, 76, 0.1)', color: '#F2C94C'}}>
                  <Map size={24}/>
                </div>
                <span className={styles.trend}>Tempo real</span>
              </div>
              <div className={styles.statLabel}>EQUIPES CADASTRADAS</div>
              <div className={styles.modernCardValue}>{stats.totalEquipes.toLocaleString()}</div>
            </div>

            <div className={styles.modernCard} style={{background: 'linear-gradient(135deg, var(--primary) 0%, #0d3880 100%)', color: 'white', border: 'none'}}>
              <div className={styles.modernCardHeader}>
                <div className={styles.modernCardIcon} style={{background: 'rgba(255, 255, 255, 0.2)', color: 'white'}}>
                  <Cpu size={24}/>
                </div>
              </div>
              <div className={styles.statLabel} style={{color: 'rgba(255,255,255,0.8)'}}>SAÚDE DO SISTEMA</div>
              <div className={styles.modernCardValue}>99.9%</div>
              <div style={{fontSize: '0.75rem', marginTop: '10px', color: 'rgba(255,255,255,0.6)'}}>Uptime nos últimos 30 dias</div>
            </div>
          </div>
          )}

          {/* Login auditado — trilha de auditoria corporativa */}
          <div className={styles.chartCard} style={{marginTop: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'}}>
              <h3 className={styles.chartTitle} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <KeyRound size={18} style={{color: 'var(--primary)'}}/> Login Auditado — Acessos Recentes
              </h3>
              {resumoLogins && (
                <div style={{display: 'flex', gap: '14px', fontSize: '0.8rem'}}>
                  <span style={{color: '#27AE60', fontWeight: 700}}>✓ {resumoLogins.sucesso ?? 0} logins com sucesso</span>
                  <span style={{color: '#EB5757', fontWeight: 700}}>✗ {resumoLogins.falha ?? 0} tentativas falhas</span>
                </div>
              )}
              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  onClick={exportAuditoriaExcel}
                  disabled={exporting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(39,174,96,0.1)', color: '#27AE60',
                    border: '1px solid rgba(39,174,96,0.35)', borderRadius: '8px',
                    padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600,
                    cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.6 : 1,
                  }}
                >
                  <FileSpreadsheet size={15}/> Exportar Excel
                </button>
                <button
                  onClick={exportAuditoriaPDF}
                  disabled={exporting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '8px',
                    padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600,
                    cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.6 : 1,
                  }}
                >
                  <FileDown size={15}/> Exportar PDF
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <select value={loginStatus} onChange={(event) => { setLoginPage(0); setLoginStatus(event.target.value); }} className={styles.filterSelect}>
                <option value="">Todos os resultados</option>
                <option value="true">Sucessos</option>
                <option value="false">Falhas</option>
              </select>
              <input
                value={loginCpf}
                onChange={(event) => { setLoginPage(0); setLoginCpf(formatCpf(event.target.value)); }}
                className={styles.searchInput}
                placeholder="Filtrar por CPF..."
                style={{ maxWidth: 220 }}
              />
              <input type="date" value={loginDataInicio} onChange={(event) => { setLoginPage(0); setLoginDataInicio(event.target.value); }} className={styles.searchInput} title="Data inicial" />
              <input type="date" value={loginDataFim} onChange={(event) => { setLoginPage(0); setLoginDataFim(event.target.value); }} className={styles.searchInput} title="Data final" />
              <input value={loginUsuario} onChange={(event) => { setLoginPage(0); setLoginUsuario(event.target.value); }} className={styles.searchInput} placeholder="Usuário..." style={{ maxWidth: 180 }} />
              <input value={loginDetalhes} onChange={(event) => { setLoginPage(0); setLoginDetalhes(event.target.value); }} className={styles.searchInput} placeholder="Detalhes..." style={{ maxWidth: 180 }} />
              <input value={loginIp} onChange={(event) => { setLoginPage(0); setLoginIp(formatIp(event.target.value)); }} className={styles.searchInput} placeholder="IP..." style={{ maxWidth: 180 }} />
              {isGlobalAdmin ? (
                <select value={loginOrgao} onChange={(event) => { setLoginPage(0); setLoginOrgao(event.target.value); }} className={styles.filterSelect}>
                  <option value="">Todos os órgãos</option>
                  {orgaos.map((orgao) => <option key={orgao.id} value={orgao.id}>{orgao.sigla} - {orgao.nome}</option>)}
                </select>
              ) : (
                <input
                  value={orgaos[0] ? `${orgaos[0].sigla} - ${orgaos[0].nome}` : 'Órgão do administrador'}
                  className={styles.searchInput}
                  readOnly
                  aria-label="Órgão do administrador"
                  style={{ maxWidth: 260 }}
                />
              )}
            </div>
            {logins.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px'}}>
                {loginError || 'Nenhum registro de acesso encontrado para os filtros selecionados.'}
              </p>
            ) : (
              <div style={{overflowX: 'auto', marginTop: '12px'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem'}}>
                  <thead>
                    <tr style={{textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)'}}>
                      <th style={{padding: '8px'}}>DATA/HORA</th>
                      <th style={{padding: '8px'}}>USUÁRIO</th>
                      <th style={{padding: '8px'}}>ÓRGÃO</th>
                      <th style={{padding: '8px'}}>CPF</th>
                      <th style={{padding: '8px'}}>IP</th>
                      <th style={{padding: '8px'}}>RESULTADO</th>
                      <th style={{padding: '8px'}}>DETALHES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logins.map((l) => (
                      <tr key={l.id} style={{borderBottom: '1px solid var(--border)'}}>
                        <td style={{padding: '8px'}}>{l.data ? new Date(l.data).toLocaleString('pt-BR') : '—'}</td>
                        <td style={{padding: '8px', fontWeight: 600}}>{l.usuario || '—'}</td>
                        <td style={{padding: '8px'}}>{l.orgao || '—'}</td>
                        <td style={{padding: '8px'}}>{l.cpf || '—'}</td>
                        <td style={{padding: '8px'}}>{l.ip || '—'}</td>
                        <td style={{padding: '8px'}}>
                          <span style={{
                            background: l.sucesso ? 'rgba(39,174,96,0.12)' : 'rgba(235,87,87,0.12)',
                            color: l.sucesso ? '#27AE60' : '#EB5757',
                            padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem'
                          }}>{l.sucesso ? 'SUCESSO' : 'FALHA'}</span>
                        </td>
                        <td style={{padding: '8px', color: 'var(--text-muted)'}}>{l.detalhes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button className={styles.pageBtn} disabled={loginPage === 0} onClick={() => setLoginPage((page) => page - 1)}>‹</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Página {loginPage + 1} de {loginTotalPages}</span>
              <button className={styles.pageBtn} disabled={loginPage >= loginTotalPages - 1} onClick={() => setLoginPage((page) => page + 1)}>›</button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

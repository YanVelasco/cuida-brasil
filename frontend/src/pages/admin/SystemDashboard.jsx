import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { dashboardService, relatorioService, auditoriaService } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, ShieldCheck, Map, Activity, Cpu, KeyRound, Target, Clock, Building2, FileDown, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import styles from './Dashboard.module.css';

const AUDIT_COLUMNS = ['Data/Hora', 'Ação', 'Usuário', 'CPF', 'IP', 'Resultado', 'Detalhes'];

function auditRowToArray(l) {
  return [
    l.data ? new Date(l.data).toLocaleString('pt-BR') : '—',
    l.acao || '—',
    l.usuario || '—',
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
  const [stats, setStats] = useState({ totalGestores: 0, totalUsuarios: 0, totalEquipes: 0 });
  const [growthData, setGrowthData] = useState([]);
  const [indicadores, setIndicadores] = useState(null);
  const [logins, setLogins] = useState([]);
  const [resumoLogins, setResumoLogins] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

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
        const [statsResponse, trendResponse, indResponse, loginsResponse, resumoResponse] = await Promise.allSettled([
          dashboardService.statsAdmin(),
          relatorioService.tendenciaMensal(),
          relatorioService.indicadores(),
          auditoriaService.listar({ acao: 'LOGIN', page: 0, size: 8 }),
          auditoriaService.resumoLogins(),
        ]);

        if (statsResponse.status === 'fulfilled') {
          setStats(statsResponse.value.data.data || statsResponse.value.data || {});
        }

        if (trendResponse.status === 'fulfilled') {
          const trendData = (trendResponse.value.data?.data || trendResponse.value.data || []).map((item) => ({
            name: item.mes || item.label || 'Mês',
            usuarios: item.total || 0,
            equipes: item.total || 0,
          }));
          setGrowthData(trendData.length ? trendData : []);
        }

        if (indResponse.status === 'fulfilled') {
          setIndicadores(indResponse.value.data?.data || indResponse.value.data);
        }
        if (loginsResponse.status === 'fulfilled') {
          const pageData = loginsResponse.value.data?.data || loginsResponse.value.data || {};
          setLogins(pageData.content || []);
        }
        if (resumoResponse.status === 'fulfilled') {
          setResumoLogins(resumoResponse.value.data?.data || resumoResponse.value.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dashboard admin:', error);
        setStats({ totalGestores: 0, totalUsuarios: 0, totalEquipes: 0 });
        setGrowthData([]);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <AdminLayout>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard Executivo</h1>
          <p style={{color: 'var(--text-muted)'}}>Visão executiva do sistema — indicadores nacionais e auditoria</p>
        </div>
      </div>

      {loading ? (
        <div style={{padding: '2rem', display: 'flex', justifyContent: 'center'}}>
          <Activity size={32} className={styles.spin} style={{color: 'var(--primary)'}} />
        </div>
      ) : (
        <>
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

          {/* Indicadores Nacionais reais */}
          {indicadores && (
            <div className={styles.stats} style={{marginTop: '20px'}}>
              <div className={styles.modernCard}>
                <div className={styles.modernCardHeader}>
                  <div className={styles.modernCardIcon} style={{background: 'rgba(39, 174, 96, 0.1)', color: '#27AE60'}}>
                    <Target size={24}/>
                  </div>
                  <span className={styles.trend}>Indicador nacional</span>
                </div>
                <div className={styles.statLabel}>TAXA DE CONCLUSÃO</div>
                <div className={styles.modernCardValue}>{indicadores.taxaConclusao ?? 0}%</div>
              </div>
              <div className={styles.modernCard}>
                <div className={styles.modernCardHeader}>
                  <div className={styles.modernCardIcon} style={{background: 'rgba(47, 128, 237, 0.1)', color: '#2F80ED'}}>
                    <Clock size={24}/>
                  </div>
                  <span className={styles.trend}>Indicador nacional</span>
                </div>
                <div className={styles.statLabel}>TEMPO MÉDIO DE RESOLUÇÃO</div>
                <div className={styles.modernCardValue}>{indicadores.tempoMedioResolucaoDias != null ? `${indicadores.tempoMedioResolucaoDias}d` : 'N/D'}</div>
              </div>
              <div className={styles.modernCard}>
                <div className={styles.modernCardHeader}>
                  <div className={styles.modernCardIcon} style={{background: 'rgba(155, 81, 224, 0.1)', color: '#9B51E0'}}>
                    <Building2 size={24}/>
                  </div>
                  <span className={styles.trend}>Indicador nacional</span>
                </div>
                <div className={styles.statLabel}>ÓRGÃOS INTEGRADOS</div>
                <div className={styles.modernCardValue}>{indicadores.orgaosIntegrados ?? 0}</div>
              </div>
              <div className={styles.modernCard}>
                <div className={styles.modernCardHeader}>
                  <div className={styles.modernCardIcon} style={{background: 'rgba(242, 153, 74, 0.1)', color: '#F2994A'}}>
                    <Map size={24}/>
                  </div>
                  <span className={styles.trend}>Inteligência territorial</span>
                </div>
                <div className={styles.statLabel}>REGIÕES ATENDIDAS</div>
                <div className={styles.modernCardValue}>{indicadores.regioesAtendidas ?? 0}</div>
              </div>
            </div>
          )}

          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px'}}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Crescimento de Usuários</h3>
              <div style={{height: '300px', width: '100%', marginTop: '20px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2F80ED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px'}} />
                    <Area type="monotone" dataKey="usuarios" stroke="#2F80ED" strokeWidth={3} fillOpacity={1} fill="url(#colorUsr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Crescimento de Equipes</h3>
              <div style={{height: '300px', width: '100%', marginTop: '20px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px'}} />
                    <Bar dataKey="equipes" fill="#27AE60" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

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
            {logins.length === 0 ? (
              <p style={{color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px'}}>
                Nenhum registro de acesso ainda. Os próximos logins serão auditados automaticamente.
              </p>
            ) : (
              <div style={{overflowX: 'auto', marginTop: '12px'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem'}}>
                  <thead>
                    <tr style={{textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)'}}>
                      <th style={{padding: '8px'}}>DATA/HORA</th>
                      <th style={{padding: '8px'}}>USUÁRIO</th>
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
          </div>
        </>
      )}
    </AdminLayout>
  );
}

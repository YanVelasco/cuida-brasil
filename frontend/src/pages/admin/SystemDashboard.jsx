import { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { dashboardService } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, ShieldCheck, Map, Activity, ArrowUpRight, Cpu } from 'lucide-react';
import styles from './Dashboard.module.css';

const MOCK_GROWTH = [
  { name: 'Jan', usuarios: 400, gestores: 24, equipes: 12 },
  { name: 'Fev', usuarios: 800, gestores: 28, equipes: 15 },
  { name: 'Mar', usuarios: 1200, gestores: 35, equipes: 18 },
  { name: 'Abr', usuarios: 2780, gestores: 42, equipes: 22 },
  { name: 'Mai', usuarios: 3890, gestores: 48, equipes: 25 },
  { name: 'Jun', usuarios: 5390, gestores: 55, equipes: 30 },
];

export default function SystemDashboard() {
  const [stats, setStats] = useState({ totalGestores: 0, totalUsuarios: 0, totalEquipes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await dashboardService.statsAdmin();
        setStats(response.data.data);
      } catch (error) {
        console.error("Erro ao carregar dashboard admin:", error);
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
          <h1 className={styles.pageTitle}>Dashboard do Administrador</h1>
          <p style={{color: 'var(--text-muted)'}}>Visão geral do sistema</p>
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
                <span className={styles.trend}><ArrowUpRight size={16}/> +12%</span>
              </div>
              <div className={styles.statLabel}>GESTORES CADASTRADOS</div>
              <div className={styles.modernCardValue}>{stats.totalGestores.toLocaleString()}</div>
            </div>
            
            <div className={styles.modernCard}>
              <div className={styles.modernCardHeader}>
                <div className={styles.modernCardIcon} style={{background: 'rgba(47, 128, 237, 0.1)', color: '#2F80ED'}}>
                  <Users size={24}/>
                </div>
                <span className={styles.trend}><ArrowUpRight size={16}/> +24%</span>
              </div>
              <div className={styles.statLabel}>USUÁRIOS ATIVOS</div>
              <div className={styles.modernCardValue}>{stats.totalUsuarios.toLocaleString()}</div>
            </div>
            
            <div className={styles.modernCard}>
              <div className={styles.modernCardHeader}>
                <div className={styles.modernCardIcon} style={{background: 'rgba(242, 201, 76, 0.1)', color: '#F2C94C'}}>
                  <Map size={24}/>
                </div>
                <span className={styles.trend}><ArrowUpRight size={16}/> +8%</span>
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

          <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px'}}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Crescimento de Usuários</h3>
              <div style={{height: '300px', width: '100%', marginTop: '20px'}}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_GROWTH} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                  <BarChart data={MOCK_GROWTH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
        </>
      )}
    </AdminLayout>
  );
}

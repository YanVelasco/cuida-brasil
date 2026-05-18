import Sidebar from './Sidebar';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children }) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button className={styles.topBarBtn}>⚫ Alto Contraste</button>
          <div className={styles.divider}/>
          <button className={styles.topBarBtn}>🤟 VLibras</button>
          <select className={styles.regionSelect}>
            <option>Selecionar região</option>
            <option>Centro</option>
            <option>Norte</option>
            <option>Sul</option>
            <option>Leste</option>
            <option>Oeste</option>
          </select>
          <button className={styles.exportBtn}>Exportar</button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

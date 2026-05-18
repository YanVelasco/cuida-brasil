import BottomNav from './BottomNav';
import styles from './MobileLayout.module.css';

export default function MobileLayout({ children, title, hideNav }) {
  return (
    <div className={styles.container}>
      {title && (
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
        </header>
      )}
      <div className={styles.content}>{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}

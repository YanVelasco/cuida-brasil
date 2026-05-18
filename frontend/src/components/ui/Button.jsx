import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', size = 'md', fullWidth, onClick, type = 'button', disabled, icon }) {
  return (
    <button
      type={type}
      className={[styles.btn, styles[variant], styles[size], fullWidth ? styles.full : '', disabled ? styles.disabled : ''].join(' ')}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}

import styles from './Input.module.css';

export default function Input({ label, id, type = 'text', placeholder, value, onChange, icon, required, error }) {
  return (
    <div className={styles.group}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <div className={styles.wrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={id}
          type={type}
          className={[styles.input, icon ? styles.hasIcon : '', error ? styles.error : ''].join(' ')}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}

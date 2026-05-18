import styles from './StatusBadge.module.css';

const STATUS_MAP = {
  aberta: { label: 'Aberta', cls: 'warning' },
  em_andamento: { label: 'Em Andamento', cls: 'primary' },
  concluida: { label: 'Concluída', cls: 'success' },
  cancelada: { label: 'Cancelada', cls: 'danger' },
  pendente: { label: 'Pendente', cls: 'muted' },
};

export default function StatusBadge({ status }) {
  const info = STATUS_MAP[status?.toLowerCase()] || { label: status, cls: 'muted' };
  return <span className={[styles.badge, styles[info.cls]].join(' ')}>{info.label}</span>;
}

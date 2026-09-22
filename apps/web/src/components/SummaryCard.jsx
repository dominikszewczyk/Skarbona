export default function SummaryCard({ label, value, detail, note, icon, tone, progress }) {
  return <div className="summary-card"><div className={`summary-icon ${tone}`}>{icon}</div><p>{label}</p><div className="summary-value">{value}</div><div className="summary-note"><span className={detail === '2' ? 'attention' : ''}>{detail}</span> {note}</div>{progress && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}</div>;
}

import { useState } from 'react';
import { ArrowDownUp, Check, ChevronDown, History, Pencil, UserRound, WalletCards, X } from 'lucide-react';

const money = (value) => `${Number(value).toLocaleString('pl-PL')} zł`;
const getStatusOrder = (student, target) => {
  if (student.paid >= target) return 0;
  if (student.paid > 0) return 1;
  return 2;
};
export default function CollectionRow({ item, expanded, onExpand, onEdit, onStudentNavigate, onTransactionNavigate }) {
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const progress = item.targetTotal ? Math.round(item.collected / item.targetTotal * 100) : 0;
  const sortedStudents = [...(item.studentStatuses || [])].sort((first, second) => {
    if (sortBy === 'status') {
      const statusDifference = getStatusOrder(first, item.target) - getStatusOrder(second, item.target);
      if (statusDifference !== 0) return sortDirection === 'asc' ? statusDifference : -statusDifference;
    }
    const nameDifference = first.name.localeCompare(second.name, 'pl', { sensitivity: 'base' });
    return sortDirection === 'asc' ? nameDifference : -nameDifference;
  });
  const handleSort = (column) => {
    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection('asc');
      return;
    }
    setSortDirection((currentDirection) => currentDirection === 'asc' ? 'desc' : 'asc');
  };
  return <div className={`collection-wrap ${expanded ? 'is-expanded' : ''}`}>
    <div className="collection-row" role="button" tabIndex="0" onClick={onExpand} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onExpand(); }}>
      <span className="collection-title">
        <span className="collection-icon">
          <WalletCards size={18} />
        </span>
        <span>
          <strong>{item.name} ({money(item.target)})</strong>
          <small>{item.type} · {item.dates}</small>
        </span>
      </span>
      <span className="payment-progress">
        <span className="progress-label">
          <b title="Łącznie zebrano">{money(item.collected)}</b> / <span title="Łączny cel zbiórki">{money(item.targetTotal)}</span><small>{progress}%</small>
        </span>
        <span className="progress">
          <span style={{ width: `${progress}%` }} /></span>
        </span>
        <span className="balance">
          <strong title="Bilans">{money(item.balance)}</strong>
          <small title="Suma wydatków">wydano {money(item.spent)}</small>
        </span>
        <span className="student-count">
          <strong>{item.students} <small>/ {item.classStudents}</small></strong>
          <small>uczniów w zbiórce / klasie</small>
        </span>
      <ChevronDown className={expanded ? 'rotate' : ''} size={18} />
    </div>
    {expanded && <div className="unpaid">
      <div className="collection-details-heading"><div><strong>Status wpłat uczniów</strong><span>{item.paid} z {item.students} opłaciło</span></div><div className="collection-detail-actions">{onEdit && <button type="button" className="text-button" onClick={(event) => { event.stopPropagation(); onEdit(); }}><Pencil size={14} /> Edytuj zbiórkę</button>}{onTransactionNavigate && <button type="button" className="text-button" onClick={(event) => { event.stopPropagation(); onTransactionNavigate(item.id); }}><History size={14} /> Zobacz historię</button>}</div></div>
      <div className="collection-payment-table"><div className="collection-payment-head"><button type="button" className="table-sort-button collection-table-sort" onClick={(event) => { event.stopPropagation(); handleSort('student'); }}><span>Uczeń</span>{sortBy === 'student' ? <ArrowDownUp size={12} className={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'} /> : <ArrowDownUp size={12} />}</button><span>Do wpłaty</span><span>Wpłacono</span><button type="button" className="table-sort-button collection-table-sort" onClick={(event) => { event.stopPropagation(); handleSort('status'); }}><span>Status</span>{sortBy === 'status' ? <ArrowDownUp size={12} className={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'} /> : <ArrowDownUp size={12} />}</button></div>{sortedStudents.length ? sortedStudents.map((student) => { const isPaid = student.paid >= item.target; const isPartial = student.paid > 0 && !isPaid; return <div className="collection-payment-row" key={student.id}><span className="collection-student-link"><button type="button" className="student-link-button" title={`Przejdź do ucznia ${student.name}`} onClick={(event) => { event.stopPropagation(); onStudentNavigate?.(student.id); }}><UserRound size={14} /></button><span>{student.name}</span></span><span>{money(item.target)}</span><span>{money(student.paid)}</span><span className={isPaid ? 'payment-paid' : isPartial ? 'payment-partial' : 'payment-unpaid'}>{isPaid ? <Check size={14} /> : isPartial ? <WalletCards size={14} /> : <X size={14} />}{isPaid ? 'Opłacono' : isPartial ? 'Częściowo' : 'Nieopłacone'}</span></div>; }) : <p className="empty-state">Brak przypisanych uczniów.</p>}</div>
    </div>}
  </div>;
}

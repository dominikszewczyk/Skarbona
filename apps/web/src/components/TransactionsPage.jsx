import { useEffect, useState } from 'react';
import { ArrowDownToLine, Plus, Search } from 'lucide-react';
import TransactionImportModal from './TransactionImportModal';

const money = (value) => `${Number(value).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł`;
const mapTransaction = (transaction) => ({ ...transaction, amount: Number(transaction.amount) });

export default function TransactionsPage({ apiUrl, classId, students, collections }) {
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const load = () => fetch(`${apiUrl}/api/classes/${classId}/transactions`).then((response) => response.json()).then((data) => setTransactions(data.map(mapTransaction))).catch(() => setTransactions([]));
  useEffect(() => { if (classId) load(); }, [classId]);
  const visible = transactions.filter((transaction) => `${transaction.referenceNumber} ${transaction.title} ${transaction.student?.firstName || ''} ${transaction.student?.lastName || ''}`.toLocaleLowerCase('pl-PL').includes(query.toLocaleLowerCase('pl-PL')));
  return <><section className="page-heading"><div><p className="eyebrow">FINANSE KLASY</p><h1>Historia transakcji</h1><p className="subheading">Transakcje zaimportowane z banku i przypisane do klasy.</p></div><button className="button primary" onClick={() => setImportOpen(true)}><Plus size={18} /> Importuj CSV</button></section><section className="transactions-panel panel"><div className="panel-heading"><div><h2>Wszystkie transakcje</h2><p>{transactions.length} zapisanych operacji</p></div><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj transakcji" /></div></div><div className="transactions-table"><div className="transactions-head"><span>Data</span><span>Numer referencyjny</span><span>Opis</span><span>Typ</span><span>Kwota</span><span>Przypisanie</span></div>{visible.length ? visible.map((transaction) => <div className="transactions-row" key={transaction.id}><span>{new Date(transaction.transactionDate).toLocaleDateString('pl-PL')}</span><span>{transaction.referenceNumber}</span><span>{transaction.title}</span><span><em className={`transaction-type ${transaction.type.toLowerCase()}`}>{transaction.type === 'PRZYCHOD' ? 'Przychód' : 'Wydatek'}</em></span><strong className={transaction.type === 'PRZYCHOD' ? 'transaction-income' : 'transaction-expense'}>{transaction.type === 'PRZYCHOD' ? '+' : '-'} {money(transaction.amount)}</strong><span>{transaction.collection?.name || transaction.student ? `${transaction.collection?.name || ''}${transaction.collection && transaction.student ? ' · ' : ''}${transaction.student ? `${transaction.student.firstName} ${transaction.student.lastName}` : ''}` : 'Nieprzypisane'}</span></div>) : <div className="transactions-empty">Brak transakcji do wyświetlenia.</div>}</div></section>{importOpen && <TransactionImportModal apiUrl={apiUrl} classId={classId} students={students} collections={collections} onClose={() => setImportOpen(false)} onSaved={() => { setImportOpen(false); load(); }} />}</>;
}

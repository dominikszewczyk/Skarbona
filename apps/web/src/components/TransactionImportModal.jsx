import { useState } from 'react';
import { Upload, X } from 'lucide-react';

const aliases = {
  referenceNumber: ['numer referencyjny'],
  transactionDate: ['data księgowania'],
  counterparty: ['nadawca / odbiorca'],
  title: ['tytułem'],
  amount: ['kwota operacji', 'kwota'],
};

const normalize = (value) => String(value || '').trim().toLocaleLowerCase('pl-PL');
const cleanValue = (value) => String(value || '').trim().replace(/^'+|'+$/g, '');
const findValue = (row, headers, names) => {
  const index = headers.findIndex((header) => names.includes(normalize(header)));
  return index >= 0 ? cleanValue(row[index]) : '';
};
const parseAmount = (value) => {
  const cleaned = String(value || '').replace(/\s/g, '').replace(/zł/gi, '').replace(/\.(?=\d{3}(?:,|$))/g, '').replace(',', '.');
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
};
const parseDate = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : raw;
};
const parseCsv = (text) => {
  const delimiter = text.split(/\r?\n/)[0].includes(';') ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === delimiter && !quoted) { row.push(cell); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && text[index + 1] === '\n') index += 1; row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, '').trim());
  const requiredColumns = ['transactionDate', 'counterparty', 'title', 'amount', 'referenceNumber'];
  if (requiredColumns.some((field) => !headers.some((header) => aliases[field].includes(normalize(header))))) return [];
  return rows.map((values, index) => {
    const amount = parseAmount(findValue(values, headers, aliases.amount));
    return {
      id: `${findValue(values, headers, aliases.referenceNumber)}-${index}`,
      referenceNumber: findValue(values, headers, aliases.referenceNumber),
      transactionDate: parseDate(findValue(values, headers, aliases.transactionDate)),
      counterparty: findValue(values, headers, aliases.counterparty),
      title: findValue(values, headers, aliases.title),
      amount: Math.abs(amount),
      type: amount < 0 ? 'WYDATEK' : 'PRZYCHOD',
      collectionId: '',
      studentId: '',
    };
  }).filter((transaction) => transaction.referenceNumber && transaction.transactionDate && transaction.counterparty && transaction.title && transaction.amount);
};

export default function TransactionImportModal({ classId, students, collections, apiUrl, onClose, onSaved }) {
  const [bank, setBank] = useState('PEKAO');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const sortedCollections = [...collections].sort((first, second) => `${first.schoolYear || ''} ${first.name || ''}`.localeCompare(`${second.schoolYear || ''} ${second.name || ''}`, 'pl-PL'));
  const sortedStudents = [...students].sort((first, second) => (first.name || '').localeCompare(second.name || '', 'pl-PL'));
  const changeBank = (value) => {
    setBank(value);
    setRows([]);
    setError(value === 'MILLENIUM' ? 'Bank jeszcze nie obsługiwany.' : '');
  };
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (bank !== 'PEKAO') {
      setError('Bank jeszcze nie obsługiwany.');
      return;
    }
    try {
      const parsed = parseCsv(await file.text());
      if (!parsed.length) throw new Error('Nie znaleziono poprawnych wierszy CSV. Dla Pekao wymagane są kolumny: Data księgowania, Nadawca / Odbiorca, Tytułem, Kwota operacji i Numer referencyjny.');
      const references = parsed.map((row) => row.referenceNumber).join(',');
      const response = await fetch(`${apiUrl}/api/classes/${classId}/transactions?references=${encodeURIComponent(references)}`);
      if (!response.ok) throw new Error('Nie udało się sprawdzić istniejących transakcji.');
      const existing = new Set((await response.json()).map((transaction) => transaction.referenceNumber));
      setRows(parsed.filter((row) => !existing.has(row.referenceNumber)));
      setError(parsed.some((row) => existing.has(row.referenceNumber)) ? 'Pominięto transakcje, które są już zapisane w historii.' : '');
    } catch (uploadError) { setRows([]); setError(uploadError.message); }
  };
  const updateRow = (id, field, value) => setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/api/classes/${classId}/transactions/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bank, transactions: rows }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Nie udało się zapisać transakcji.');
      onSaved();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="transaction-import-modal" onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">IMPORT BANKOWY</p><h2>Import transakcji</h2></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div><label>Bank<select value={bank} onChange={(event) => changeBank(event.target.value)}><option value="PEKAO">Pekao</option><option value="MILLENIUM">Millenium</option></select></label><label className="file-upload"><Upload size={17} /> Wybierz plik CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} /></label>{error && <p className="form-error">{error}</p>}{rows.length > 0 && <div className="transaction-preview"><div className="transaction-preview-head"><span>Numer referencyjny</span><span>Data</span><span>Nadawca / Odbiorca</span><span>Tytułem</span><span>Kwota</span><span>Typ</span><span>Zbiórka</span><span>Uczeń</span></div>{rows.map((row) => <div className="transaction-preview-row" key={row.id}><span>{row.referenceNumber}</span><span>{row.transactionDate}</span><span>{row.counterparty}</span><span>{row.title}</span><span>{row.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span><select value={row.type} onChange={(event) => updateRow(row.id, 'type', event.target.value)}><option value="PRZYCHOD">Przychód</option><option value="WYDATEK">Wydatek</option></select><select value={row.collectionId} onChange={(event) => updateRow(row.id, 'collectionId', event.target.value)}><option value="">Brak</option>{sortedCollections.map((collection) => <option value={collection.id} key={collection.id}>{collection.name} ({collection.schoolYear})</option>)}</select><select value={row.studentId} onChange={(event) => updateRow(row.id, 'studentId', event.target.value)}><option value="">Brak</option>{sortedStudents.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select></div>)}</div>}<div className="modal-actions"><button className="button secondary" onClick={onClose}>Anuluj</button><button className="button primary" disabled={!rows.length || saving} onClick={save}>{saving ? 'Zapisywanie...' : 'Zapisz transakcje'}</button></div></div></div>;
}

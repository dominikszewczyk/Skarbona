import { useEffect, useMemo, useState } from 'react';
import { Mail, Pencil, Phone, Plus, Power, Search } from 'lucide-react';
import ClassHeader from './ClassHeader';

export default function StudentsPage({ classData, students: rows, onToggle, onEdit, onEditClass, onAdd, selectedStudentId }) {
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  useEffect(() => {
    const selectedStudent = rows.find((student) => student.id === selectedStudentId);
    setQuery(selectedStudent?.name || '');
  }, [rows, selectedStudentId]);
  const visibleRows = useMemo(() => rows.filter((student) => student.name.toLocaleLowerCase('pl-PL').includes(query.toLocaleLowerCase('pl-PL'))).sort((first, second) => sortAscending ? first.name.localeCompare(second.name, 'pl') : second.name.localeCompare(first.name, 'pl')), [rows, query, sortAscending]);
  const genderLabel = { KOBIETA: 'Kobieta', MEZCZYZNA: 'Mężczyzna', NIE_PODANO: 'Nie podano' };
  const womenCount = rows.filter((student) => student.gender === 'KOBIETA').length;
  const menCount = rows.filter((student) => student.gender === 'MEZCZYZNA').length;
  return <><section className="page-heading"><div><p className="eyebrow">LISTA KLASY</p><h1>Uczniowie</h1><p className="subheading">Zarządzaj uczniami i danymi kontaktowymi rodziców.</p></div><div className="heading-actions"><button className="button secondary" onClick={onEditClass}><Pencil size={16} /> Edytuj klasę</button><button className="button primary" onClick={onAdd}><Plus size={18} /> Dodaj ucznia</button></div></section><ClassHeader classData={classData} studentsCount={rows.length} womenCount={womenCount} menCount={menCount} /><section className="student-panel panel"><div className="panel-heading"><div><h2>Lista uczniów</h2><p>{rows.filter((student) => student.active).length} aktywnych uczniów</p></div><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj ucznia" /></div></div><div className="student-table student-table-head"><button className="table-sort-button" onClick={() => setSortAscending((value) => !value)}>Uczeń <span>{sortAscending ? '↑' : '↓'}</span></button><span>Płeć</span><span>Kontakt</span><span>Rodzic / opiekun</span><span>Status</span><span>Akcje</span></div>{visibleRows.map((student) => <div className={`student-table student-table-row ${student.active ? '' : 'inactive-row'}`} key={student.id || student.name}><span className="student-name"><span className={`student-initial ${student.gender === 'KOBIETA' ? 'female' : student.gender === 'MEZCZYZNA' ? 'male' : ''}`}>{student.name.split(' ').map((part) => part[0]).join('')}</span><strong>{student.name}</strong></span><span>{genderLabel[student.gender] || 'Nie podano'}</span><ContactCell student={student} /><span className="parent-list"><span>{student.parent1}</span><span>{student.parent2}</span></span><span><em className={student.active ? 'status active' : 'status inactive'}>{student.active ? 'Aktywny' : 'Nieaktywny'}</em></span><span className="row-actions"><button className="icon-button" title="Edytuj ucznia" onClick={() => onEdit(student)}><Pencil size={16} /></button><button className="icon-button danger" title={student.active ? 'Dezaktywuj ucznia' : 'Aktywuj ucznia'} onClick={() => onToggle(student)}><Power size={16} /></button></span></div>)}</section></>;
}

function ContactCell({ student }) {
  const contacts = [{ phone: student.parent1Phone, mail: student.parent1Mail }, { phone: student.parent2Phone, mail: student.parent2Mail }];
  return <span className="contact-list">{contacts.map((contact, index) => <span key={index}><a className={contact.phone ? '' : 'empty-contact'} href={contact.phone ? `tel:${contact.phone}` : undefined} title={contact.phone || undefined}><Phone size={14} /></a><a className={contact.mail ? '' : 'empty-contact'} href={contact.mail ? `mailto:${contact.mail}` : undefined} title={contact.mail || undefined}><Mail size={14} /></a></span>)}</span>;
}

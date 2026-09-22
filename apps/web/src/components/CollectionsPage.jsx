import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import ClassHeader from './ClassHeader';
import CollectionRow from './CollectionRow';

export default function CollectionsPage({ classData, collections, onAdd, onEdit, onStudentNavigate }) {
  const [query, setQuery] = useState('');
  const [schoolYear, setSchoolYear] = useState(classData?.schoolYear || 'all');
  useEffect(() => {
    setSchoolYear(classData?.schoolYear || 'all');
  }, [classData?.schoolYear]);
  const womenCount = classData?.students?.filter((student) => student.gender === 'KOBIETA').length || 0;
  const menCount = classData?.students?.filter((student) => student.gender === 'MEZCZYZNA').length || 0;
  const schoolYears = [...new Set(collections.map((collection) => collection.schoolYear).filter(Boolean))];
  const filteredCollections = collections.filter((collection) => {
    const matchesQuery = !query.trim() || `${collection.name} ${collection.type} ${collection.dates}`.toLocaleLowerCase('pl-PL').includes(query.trim().toLocaleLowerCase('pl-PL'));
    return matchesQuery && (schoolYear === 'all' || collection.schoolYear === schoolYear);
  });
  return <><section className="page-heading"><div><p className="eyebrow">FINANSE KLASY</p><h1>Zbiórki</h1><p className="subheading">Pełna historia zbiórek i rozliczeń klasy.</p></div><button className="button primary" onClick={onAdd}><Plus size={18} /> Nowa zbiórka</button></section><ClassHeader classData={classData} studentsCount={classData?.students?.length || 0} womenCount={womenCount} menCount={menCount} eyebrow="ZBIÓRKI KLASY" /><section className="collections-list-panel panel"><div className="panel-heading"><div><h2>Wszystkie zbiórki</h2><p>Wyświetlono {filteredCollections.length} z {collections.length} zbiórek.</p></div><div className="collection-filters"><select className="collection-year-filter" value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)}><option value="all">Wszystkie roczniki</option>{schoolYears.map((year) => <option key={year} value={year}>{year}</option>)}</select><label className="collection-filter"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Szukaj zbiórki" /></label></div></div><div className="table-header"><span>Nazwa zbiórki</span><span>Postęp wpłat</span><span>Bilans</span><span>Uczniowie</span><span /></div>{filteredCollections.map((item) => <CollectionRow key={item.id} item={item} expanded={item.expanded} onExpand={item.onExpand} onEdit={() => onEdit(item)} onStudentNavigate={onStudentNavigate} />)}</section></>;
}

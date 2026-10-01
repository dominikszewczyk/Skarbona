import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ClassHeader.css';

export default function ClassHeader({ classData, studentsCount, womenCount = 0, menCount = 0, eyebrow = 'TWOJA KLASA' }) {
  const chairperson = classData?.chairperson?.name || classData?.chairpersonName || 'Nie przypisano';
  const deputy = classData?.deputy?.name || classData?.deputyName || 'Nie przypisano';
  const yearVersions = classData?.yearVersions || [];
  const activeYearIndex = yearVersions.findIndex((version) => version.schoolYear === classData?.schoolYear);
  const onChangeYear = classData?.onChangeYear;
  return <div className="subpage-header panel"><div><p className="eyebrow">{eyebrow}</p><h1>{classData?.name || 'Brak klasy'}</h1><p>{classData?.description || 'Brak opisu klasy'}</p><p>Wychowawca: <strong>{classData?.teacher || 'Nie przypisano'}</strong></p><p>Przewodniczący: <strong>{chairperson}</strong></p><p>Zastępca: <strong>{deputy}</strong></p></div><div className="class-header-stats"><span><strong>{studentsCount ?? 0}</strong> uczniów</span><span><strong>{womenCount}</strong> kobiet</span><span><strong>{menCount}</strong> mężczyzn</span><span className="class-year-control"><button className="icon-button" type="button" aria-label="Poprzedni rocznik" title="Poprzedni rocznik" disabled={activeYearIndex <= 0} onClick={() => onChangeYear?.(yearVersions[activeYearIndex - 1]?.schoolYear)}><ChevronLeft size={17} /></button><span><strong>{classData?.schoolYear || '2024/25'}</strong> rok szkolny</span><button className="icon-button" type="button" aria-label="Następny rocznik" title="Następny rocznik" disabled={activeYearIndex < 0 || activeYearIndex >= yearVersions.length - 1} onClick={() => onChangeYear?.(yearVersions[activeYearIndex + 1]?.schoolYear)}><ChevronRight size={17} /></button></span></div></div>;
}

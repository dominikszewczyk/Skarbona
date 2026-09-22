import { ChevronRight, X } from 'lucide-react';

export default function CollectionStudentPicker({ students, selectedIds, onChange }) {
  const selected = students.filter((student) => selectedIds.includes(student.id));
  const available = students.filter((student) => !selectedIds.includes(student.id));
  const move = (student, include) => onChange(include ? [...selectedIds, student.id] : selectedIds.filter((id) => id !== student.id));
  return <div className="collection-student-picker"><div><strong>Przypisani uczniowie</strong>{selected.length ? selected.map((student) => <button type="button" className="picker-student" key={student.id} onClick={() => move(student, false)}>{student.name}<X size={14} /></button>) : <span className="picker-empty">Brak przypisanych uczniów</span>}</div><div><strong>Do dodania</strong>{available.length ? available.map((student) => <button type="button" className="picker-student" key={student.id} onClick={() => move(student, true)}>{student.name}<ChevronRight size={14} /></button>) : <span className="picker-empty">Wszyscy uczniowie są przypisani</span>}</div></div>;
}
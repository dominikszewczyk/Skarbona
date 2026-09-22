import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, Bell, ChevronDown, ChevronRight, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Menu, Pencil, Plus, Power, Search, Settings, Sparkles, Users, WalletCards, X } from 'lucide-react';
import './styles.css';
import CollectionRow from './components/CollectionRow';
import CollectionsPage from './components/CollectionsPage';
import CollectionStudentPicker from './components/CollectionStudentPicker';
import RoleField from './components/RoleField';
import StudentsPage from './components/StudentsPage';
import SummaryCard from './components/SummaryCard';
import TransactionsPage from './components/TransactionsPage';

const initialStudents = [];
const routeToNav = (pathname) => (pathname.startsWith('/collections') ? 'Zbiórki' : pathname.startsWith('/students') ? 'Uczniowie' : pathname.startsWith('/transactions') ? 'Transakcje' : 'Przegląd');
const money = (value) => `${value.toLocaleString('pl-PL')} zł`;
const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = /^https?:\/\//.test(configuredApiUrl) ? configuredApiUrl.replace(/\/+$/, '') : 'http://localhost:3000';
const mapStudent = (student) => ({
  ...student,
  name: `${student.firstName} ${student.lastName}`,
  phone: student.parent1Phone || student.parent2Phone || 'Brak telefonu',
  parent: student.parent1 || student.parent2 || 'Brak danych'
});
const mapCollection = (collection, classStudents = []) => {
  const collected = collection.contributions.reduce((total, contribution) => total + Number(contribution.amount), 0);
  const paidByStudent = new Map();
  collection.contributions.forEach((contribution) => paidByStudent.set(contribution.studentId, (paidByStudent.get(contribution.studentId) || 0) + Number(contribution.amount)));
  const studentStatuses = collection.students.map((student) => ({
    id: student.id,
    name: `${student.firstName} ${student.lastName}`,
    gender: student.gender,
    paid: paidByStudent.get(student.id) || 0
  }));
  const target = Number(collection.target);
  return {
    ...collection,
    type: collection.schoolYear || 'Zbiórka',
    dates: `${new Date(collection.startsAt).toLocaleDateString('pl-PL')} – ${new Date(collection.endsAt).toLocaleDateString('pl-PL')}`,
    collected,
    target,
    targetTotal: target * collection.students.length,
    spent: Number(collection.spent),
    students: collection.students.length,
    classStudents: classStudents.length || collection.classStudents || 0,
    paid: studentStatuses.filter((student) => student.paid > 0).length,
    unpaid: studentStatuses.filter((student) => !student.paid).map((student) => student.name),
    studentStatuses
  };
};

function App() {
  const [activeNav, setActiveNav] = useState(() => routeToNav(window.location.pathname));
  const [selectedRouteStudent, setSelectedRouteStudent] = useState(() => new URLSearchParams(window.location.search).get('student'));
  const [expanded, setExpanded] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [hasClass, setHasClass] = useState(false);
  const [studentRows, setStudentRows] = useState(initialStudents);
  const [collectionRows, setCollectionRows] = useState([]);
  const [classId, setClassId] = useState(null);
  const [classData, setClassData] = useState({
    name: '3B',
    schoolYear: '2025/2026',
    description: '',
    teacher: 'Maria Wiśniewska',
    chairpersonName: '',
    deputyName: ''
  });
  const [editingClass, setEditingClass] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [editingCollection, setEditingCollection] = useState(false);
  const [collectionStudentIds, setCollectionStudentIds] = useState([]);
  const [collectionSelectionMode, setCollectionSelectionMode] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const totalCollected = collectionRows.reduce((sum, item) => sum + item.collected, 0);
  const totalSpent = collectionRows.reduce((sum, item) => sum + item.spent, 0);
  const totalTarget = collectionRows.reduce((sum, item) => sum + item.targetTotal, 0);
  const collectionProgress = totalTarget ? Math.round((totalCollected / totalTarget) * 100) : 0;
  const activeCollections = collectionRows.filter((item) => new Date(item.endsAt) >= new Date()).length;
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setActiveNav(routeToNav(path));
    setSelectedRouteStudent(new URL(path, window.location.origin).searchParams.get('student'));
    setMobileOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const inputs = [...form.querySelectorAll('input')];
    const valueOf = (name, fallbackIndex) => form.querySelector(`[name="${name}"]`)?.value || inputs[fallbackIndex]?.value || '';
    const formValues = Object.fromEntries(new FormData(form).entries());
    const statusControl = [...form.querySelectorAll('select')].at(-1);
    const formData =
      modal === 'class'
        ? {
            className: formValues.className,
            schoolYear: formValues.schoolYear,
            classDescription: formValues.classDescription,
            teacher: formValues.teacher,
            chairpersonName: formValues.chairpersonName,
            deputyName: formValues.deputyName
          }
        : {
            firstName: formValues.firstName || valueOf('firstName', 0),
            lastName: formValues.lastName || valueOf('lastName', 1),
            parent1: formValues.parent1 || valueOf('parent1', 2),
            parent2: formValues.parent2 || valueOf('parent2', 3),
            parent1Phone: formValues.parent1Phone || valueOf('parent1Phone', 4),
            parent2Phone: formValues.parent2Phone || valueOf('parent2Phone', 5),
            parent1Mail: formValues.parent1Mail || valueOf('parent1Mail', 6),
            parent2Mail: formValues.parent2Mail || valueOf('parent2Mail', 7),
            gender: formValues.gender || form.querySelector('[name="gender"]')?.value || 'NIE_PODANO',
            active: modal === 'edit-student' ? statusControl?.value !== 'Nieaktywny' : true
          };
    if ((modal === 'student' || modal === 'edit-student') && (!formData.firstName.trim() || !formData.lastName.trim())) {
      setToast('Imię i nazwisko ucznia są wymagane.');
      return;
    }
    try {
      if (modal === 'class') {
        const ownerResponse = await fetch(`${API_URL}/api/users/by-login/dominik`);
        if (!ownerResponse.ok) throw new Error('Nie udało się odnaleźć użytkownika Dominik.');
        const owner = await ownerResponse.json();
        const endpoint = editingClass ? `${API_URL}/api/classes/${classId}` : `${API_URL}/api/classes`;
        const response = await fetch(endpoint, {
          method: editingClass ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerId: owner.id,
            name: formData.className,
            schoolYear: formData.schoolYear,
            description: formData.classDescription,
            teacher: formData.teacher,
            chairpersonName: formData.chairpersonName,
            deputyName: formData.deputyName
          })
        });
        if (!response.ok) throw new Error('Nie udało się zapisać klasy.');
        const savedClass = await response.json();
        setClassId(savedClass.id);
        setClassData(savedClass);
        setHasClass(true);
        setModal(null);
        setEditingClass(false);
        setToast(editingClass ? 'Klasa została zaktualizowana.' : 'Klasa została utworzona.');
      } else if (modal === 'student' || modal === 'edit-student') {
        const endpoint = modal === 'edit-student' ? `${API_URL}/api/classes/${classId}/students/${selectedStudent.id}` : `${API_URL}/api/classes/${classId}/students`;
        const response = await fetch(endpoint, {
          method: modal === 'edit-student' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Nie udało się zapisać ucznia.');
        }
        const savedStudent = await response.json();
        setStudentRows((rows) => (modal === 'edit-student' ? rows.map((row) => (row.id === savedStudent.id ? mapStudent(savedStudent) : row)) : [...rows, mapStudent(savedStudent)]));
        setModal(null);
        setToast(modal === 'edit-student' ? 'Dane ucznia zostały zaktualizowane.' : 'Uczeń został dodany do klasy.');
      } else if (modal === 'collection') {
        const isEdit = editingCollection && selectedCollection;
        const selectedStudentIds = collectionSelectionMode === 'all' ? studentRows.filter((student) => student.active && student.id).map((student) => student.id) : collectionSelectionMode === 'later' ? [] : collectionStudentIds;
        const collectionData = {
          name: form.querySelector('[name="collectionName"]')?.value || inputs[0]?.value?.trim(),
          startsAt: form.querySelector('[name="startsAt"]')?.value || inputs[1]?.value,
          endsAt: form.querySelector('[name="endsAt"]')?.value || inputs[2]?.value,
          target: form.querySelector('[name="target"]')?.value || inputs[3]?.value,
          studentIds: selectedStudentIds
        };
        if (!collectionData.name || !collectionData.startsAt || !collectionData.endsAt || !collectionData.target) throw new Error('Uzupełnij nazwę, daty i kwotę zbiórki.');
        const response = await fetch(isEdit ? `${API_URL}/api/classes/${classId}/collections/${selectedCollection.id}` : `${API_URL}/api/classes/${classId}/collections`, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectionData)
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Nie udało się zapisać zbiórki.');
        }
        const savedCollection = await response.json();
        setCollectionRows((rows) => (isEdit ? rows.map((row) => (row.id === savedCollection.id ? mapCollection(savedCollection, studentRows) : row)) : [...rows, mapCollection(savedCollection, studentRows)]));
        setModal(null);
        setEditingCollection(false);
        setSelectedCollection(null);
        setToast(isEdit ? 'Zbiórka została zaktualizowana.' : 'Zbiórka została utworzona.');
      }
    } catch (error) {
      setToast(error.message);
    }
    setModal(null);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleStudentStatus = async () => {
    const nextActive = !pendingStatus.active;
    try {
      const response = await fetch(`${API_URL}/api/classes/${classId}/students/${pendingStatus.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive })
      });
      if (!response.ok) throw new Error('Nie udało się zmienić statusu ucznia.');
      const savedStudent = await response.json();
      setStudentRows((rows) => rows.map((row) => (row.id === savedStudent.id ? mapStudent(savedStudent) : row)));
      setPendingStatus(null);
      setToast(nextActive ? 'Uczeń został aktywowany.' : 'Uczeń został dezaktywowany.');
    } catch (error) {
      setToast(error.message);
    }
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveNav(routeToNav(window.location.pathname));
      setSelectedRouteStudent(new URLSearchParams(window.location.search).get('student'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!modal || (modal !== 'student' && modal !== 'edit-student' && modal !== 'class' && modal !== 'collection')) return;
    requestAnimationFrame(() => {
      const form = document.querySelector('.modal');
      const inputs = form?.querySelectorAll('input') || [];
      const textareas = form?.querySelectorAll('textarea') || [];
      const setInputName = (index, name) => {
        if (inputs[index] && !inputs[index].name) inputs[index].name = name;
      };
      if (modal === 'class') {
        setInputName(0, 'className');
        if (textareas[0] && !textareas[0].name) textareas[0].name = 'classDescription';
      }
      if (modal === 'collection') {
        setInputName(0, 'collectionName');
        setInputName(1, 'startsAt');
        setInputName(2, 'endsAt');
        setInputName(3, 'target');
        if (selectedCollection) {
          const values = [selectedCollection.name, selectedCollection.startsAt.slice(0, 10), selectedCollection.endsAt.slice(0, 10), selectedCollection.target];
          values.forEach((value, index) => {
            if (inputs[index]) inputs[index].value = value || '';
          });
        }
      }
      if (modal === 'student' || modal === 'edit-student') {
        ['firstName', 'lastName', 'parent1', 'parent2', 'parent1Phone', 'parent2Phone', 'parent1Mail', 'parent2Mail'].forEach((name, index) => setInputName(index, name));
      }
      const submitButton = form?.querySelector('.button.full');
      const statusLabel = form && [...form.querySelectorAll('label')].find((label) => label.textContent.trim().startsWith('Status'));
      const isStudentEdit = modal === 'edit-student';
      if (modal === 'class' && form && !form.querySelector('[data-school-year-field]')) {
        const yearLabel = document.createElement('label');
        yearLabel.dataset.schoolYearField = 'true';
        yearLabel.textContent = 'Rocznik szkolny';
        const yearInput = document.createElement('input');
        yearInput.name = 'schoolYear';
        yearInput.required = true;
        yearInput.placeholder = 'np. 2025/2026';
        yearInput.pattern = '[0-9]{4}/[0-9]{4}';
        yearInput.value = classData.schoolYear || '2025/2026';
        yearLabel.appendChild(yearInput);
        const firstLabel = form.querySelector('label');
        if (firstLabel) firstLabel.after(yearLabel);
      }
      if (modal === 'collection' && form && !form.querySelector('[data-collection-school-year]')) {
        const yearInfo = document.createElement('div');
        yearInfo.dataset.collectionSchoolYear = 'true';
        yearInfo.className = 'form-readonly';
        yearInfo.innerHTML = `<span>Rok szkolny</span><strong>${classData.schoolYear || '2025/2026'}</strong>`;
        const firstLabel = form.querySelector('label');
        if (firstLabel) firstLabel.before(yearInfo);
      }
      if (modal === 'collection' && form) {
        const collectionSelect = form.querySelector('select');
        if (collectionSelect) {
          collectionSelect.name = 'studentSelection';
          collectionSelect.className = 'collection-student-selection';
          collectionSelect.replaceChildren(
            ...[
              ['all', 'Wybierz wszystkich aktywnych uczniów'],
              ['manual', 'Wybierz uczniów'],
              ['later', 'Wybiorę uczniów później']
            ].map(([value, label]) => {
              const option = document.createElement('option');
              option.value = value;
              option.textContent = label;
              return option;
            })
          );
          collectionSelect.value = collectionSelectionMode;
          collectionSelect.onchange = (event) => {
            const mode = event.target.value;
            setCollectionSelectionMode(mode);
            if (mode === 'all') setCollectionStudentIds(studentRows.filter((student) => student.active).map((student) => student.id));
            else if (mode === 'manual' && collectionSelectionMode === 'all') setCollectionStudentIds(studentRows.filter((student) => student.active).map((student) => student.id));
            else if (mode === 'later') setCollectionStudentIds([]);
          };
        }
        form.querySelector('[data-collection-student-picker]')?.remove();
        if (collectionSelectionMode === 'manual') {
          const picker = document.createElement('div');
          picker.dataset.collectionStudentPicker = 'true';
          form.appendChild(picker);
          createRoot(picker).render(<CollectionStudentPicker students={editingCollection ? studentRows : studentRows.filter((student) => student.active)} selectedIds={collectionStudentIds} onChange={setCollectionStudentIds} />);
        }
      }
      if (statusLabel) statusLabel.style.display = isStudentEdit ? 'flex' : 'none';
      if (submitButton && modal === 'class') submitButton.textContent = editingClass ? 'Zapisz' : 'Utwórz klasę';
      if (submitButton && modal === 'collection') submitButton.textContent = editingCollection ? 'Zapisz zmiany' : 'Utwórz zbiórkę';
      if (submitButton && modal === 'student') submitButton.textContent = 'Dodaj ucznia';
      if (submitButton && modal === 'edit-student') submitButton.textContent = 'Zapisz';
      let genderLabel = form?.querySelector('[data-gender-field]');
      if ((modal === 'student' || isStudentEdit) && form && !genderLabel) {
        genderLabel = document.createElement('label');
        genderLabel.dataset.genderField = 'true';
        genderLabel.textContent = 'Płeć';
        const genderSelect = document.createElement('select');
        genderSelect.name = 'gender';
        [
          ['NIE_PODANO', 'Nie podano'],
          ['KOBIETA', 'Kobieta'],
          ['MEZCZYZNA', 'Mężczyzna']
        ].forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          genderSelect.appendChild(option);
        });
        genderLabel.appendChild(genderSelect);
        if (statusLabel) form.insertBefore(genderLabel, statusLabel);
        else form.appendChild(genderLabel);
      }
      if (modal === 'edit-student' && selectedStudent) {
        const values = [selectedStudent.firstName, selectedStudent.lastName, selectedStudent.parent1, selectedStudent.parent2, selectedStudent.parent1Phone, selectedStudent.parent2Phone, selectedStudent.parent1Mail, selectedStudent.parent2Mail];
        values.forEach((value, index) => {
          if (inputs[index]) inputs[index].value = value || '';
        });
        if (genderLabel) genderLabel.querySelector('select').value = selectedStudent.gender || 'NIE_PODANO';
      }
      if (modal === 'class' && editingClass) {
        const values = {
          className: classData.name,
          schoolYear: classData.schoolYear,
          teacher: classData.teacher,
          chairpersonName: classData.chairpersonName,
          deputyName: classData.deputyName
        };
        Object.entries(values).forEach(([name, value]) => {
          const field = form?.querySelector(`[name="${name}"]`);
          if (field) field.value = value || '';
        });
        const description = form?.querySelector('textarea');
        if (description) description.value = classData.description || '';
      }
    });
  }, [modal, selectedStudent, selectedCollection, collectionStudentIds, collectionSelectionMode, editingCollection, studentRows, classData]);

  useEffect(() => {
    fetch(`${API_URL}/api/users/by-login/dominik/classes`)
      .then((response) => {
        if (!response.ok) throw new Error('Nie udało się pobrać klas.');
        return response.json();
      })
      .then((classes) => {
        if (!classes.length) return;
        const currentClass = classes[0];
        setClassId(currentClass.id);
        setClassData(currentClass);
        setStudentRows(currentClass.students.map(mapStudent));
        setCollectionRows(currentClass.collections.map((collection) => mapCollection(collection, currentClass.students)));
        setHasClass(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const settingsButton = document.querySelector('.class-info .icon-button');
    if (!settingsButton) return undefined;
    const openEditor = () => {
      setEditingClass(true);
      setModal('class');
    };
    settingsButton.addEventListener('click', openEditor);
    return () => settingsButton.removeEventListener('click', openEditor);
  }, [hasClass, classData]);

  const openNewCollection = () => {
    setEditingCollection(false);
    setSelectedCollection(null);
    setCollectionSelectionMode('all');
    setCollectionStudentIds(studentRows.filter((student) => student.active).map((student) => student.id));
    setModal('collection');
  };

  useEffect(() => {
    if (modal === 'collection' && !editingCollection) {
      setCollectionSelectionMode('all');
      setCollectionStudentIds(studentRows.filter((student) => student.active).map((student) => student.id));
    }
  }, [modal, editingCollection]);

  return (
    <div className='app-shell'>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${!hasClass ? 'no-class' : ''}`}>
        <div className='brand'>
          <div className='brand-mark'>
            <Sparkles size={19} />
          </div>
          <span>Skarbona</span>
          {mobileOpen && (
            <button className='icon-button close-menu' onClick={() => setMobileOpen(false)}>
              <X size={18} />
            </button>
          )}
        </div>
        <div className='workspace-label'>TWOJA PRZESTRZEŃ</div>
        <button className='class-switcher'>
          <span className='class-avatar'>{classData.name?.slice(0, 2) || '—'}</span>
          <span>
            <strong>{classData.name || 'Brak klasy'}</strong>
            <small>{classData.description || 'Wybierz lub utwórz klasę'}</small>
          </span>
          <ChevronDown size={16} />
        </button>
        <nav>
          {['Przegląd', 'Zbiórki', 'Uczniowie', 'Transakcje'].map((item, index) => (
            <button key={item} className={activeNav === item ? 'nav-item active' : 'nav-item'} onClick={() => navigate(index === 0 ? '/' : index === 1 ? '/collections' : index === 2 ? '/students' : '/transactions')}>
              <span>{[<LayoutDashboard size={18} />, <WalletCards size={18} />, <Users size={18} />, <ClipboardList size={18} />][index]}</span>
              {item}
              {item === 'Zbiórki' && <em>{collectionRows.length}</em>}
            </button>
          ))}
        </nav>
        <div className='sidebar-bottom'>
          <button className='nav-item'>
            <Settings size={18} />
            Ustawienia
          </button>
          <div className='user-card'>
            <div className='user-avatar'>DS</div>
            <span>
              <strong>Dominik Szewczyk</strong>
              <small>Administrator</small>
            </span>
            <LogOut size={16} />
          </div>
        </div>
      </aside>
      <main className='main-content'>
        <header className='topbar'>
          <button className='mobile-menu icon-button' onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>
          <div className='breadcrumbs'>
            <span>Moja przestrzeń</span>
            <ChevronRight size={15} />
            <strong>{activeNav}</strong>
          </div>
          <div className='top-actions'>
            <button className='help-link'>
              <CircleHelp size={17} /> Pomoc
            </button>
            <button className='notification icon-button'>
              <Bell size={18} />
              <i />
            </button>
            <div className='top-avatar'>DS</div>
          </div>
        </header>
        <div className='page-wrap'>
          {!hasClass ? (
            <section className='empty-class-state'>
              <div className='empty-class-icon'>
                <Sparkles size={28} />
              </div>
              <p className='eyebrow'>WITAJ W SKARBONIE</p>
              <h1>Utwórz swoją pierwszą klasę</h1>
              <p className='empty-class-copy'>Zacznij od dodania klasy, aby móc prowadzić zbiórki, zarządzać uczniami i kontrolować rozliczenia.</p>
              <button
                className='button primary'
                onClick={() => {
                  setEditingClass(false);
                  setModal('class');
                }}
              >
                <Plus size={18} /> Utwórz klasę
              </button>
            </section>
          ) : (
            <>
              {activeNav === 'Uczniowie' ? (
                <StudentsPage
                  classData={classData}
                  students={studentRows}
                  selectedStudentId={selectedRouteStudent}
                  onToggle={(student) => setPendingStatus(student)}
                  onEdit={(student) => {
                    setSelectedStudent(student);
                    setModal('edit-student');
                  }}
                  onEditClass={() => {
                    setEditingClass(true);
                    setModal('class');
                  }}
                  onAdd={() => {
                    setSelectedStudent(null);
                    setModal('student');
                  }}
                />
              ) : activeNav === 'Zbiórki' ? (
                <CollectionsPage
                  classData={{ ...classData, students: studentRows }}
                  collections={collectionRows.map((item) => ({
                    ...item,
                    expanded: expanded === item.id,
                    onExpand: () => setExpanded(expanded === item.id ? -1 : item.id)
                  }))}
                  onAdd={openNewCollection}
                  onStudentNavigate={(studentId) => navigate(`/students?student=${encodeURIComponent(studentId)}`)}
                  onEdit={(collection) => {
                    const assignedStudentIds = Array.isArray(collection.students) ? collection.students.map((student) => student.id) : (collection.studentStatuses || []).map((student) => student.id);
                    setSelectedCollection(collection);
                    setCollectionStudentIds(assignedStudentIds);
                    setCollectionSelectionMode(assignedStudentIds.length ? 'manual' : 'later');
                    setEditingCollection(true);
                    setModal('collection');
                  }}
                />
              ) : activeNav === 'Transakcje' ? (
                <TransactionsPage apiUrl={API_URL} classId={classId} students={studentRows} collections={collectionRows} />
              ) : (
                <>
                  <section className='page-heading'>
                    <div>
                      <p className='eyebrow'>PONIEDZIAŁEK, 9 GRUDNIA 2024</p>
                      <h1>
                        Dzień dobry, Dominiku <span>✦</span>
                      </h1>
                      <p className='subheading'>{classData.description || `Podsumowanie klasy ${classData.name || ''}.`}</p>
                    </div>
                    <div className='heading-actions'>
                      <button className='button secondary'>
                        <ArrowDownToLine size={17} /> Eksportuj
                      </button>
                      <button className='button primary' onClick={openNewCollection}>
                        <Plus size={18} /> Nowa zbiórka
                      </button>
                    </div>
                  </section>
                  <section className='summary-grid'>
                    <SummaryCard label='Saldo klasy' value={money(totalCollected - totalSpent)} detail='API' note='aktualne dane' icon={<WalletCards size={21} />} tone='blue' />
                    <SummaryCard label='Zebrano w tym roku' value={money(totalCollected)} detail={`${collectionProgress}%`} note={`z planowanych ${money(totalTarget)}`} icon={<Sparkles size={21} />} tone='yellow' progress={collectionProgress} />
                    <SummaryCard label='Aktywne zbiórki' value={String(activeCollections)} detail={String(collectionRows.length)} note='wszystkich zbiórek' icon={<WalletCards size={21} />} tone='green' />
                  </section>
                  <section className='content-grid'>
                    <div className='collections-panel panel'>
                      <div className='panel-heading'>
                        <div>
                          <h2>Ostatnie zbiórki</h2>
                          <p>Monitoruj wpłaty i wydatki swojej klasy.</p>
                        </div>
                        <button className='text-button' onClick={() => setActiveNav('Zbiórki')}>
                          Zobacz wszystkie <ChevronRight size={16} />
                        </button>
                      </div>
                      <div className='table-header'>
                        <span>Nazwa zbiórki</span>
                        <span>Postęp wpłat</span>
                        <span>Bilans</span>
                        <span>Uczniowie</span>
                        <span />
                      </div>
                      {collectionRows.map((item, index) => (
                        <CollectionRow key={`${item.name}-${item.schoolYear}-${item.id}`} item={item} expanded={expanded === index} onExpand={() => setExpanded(expanded === index ? -1 : index)} />
                      ))}
                    </div>
                    <aside className='side-column'>
                      <div className='quick-panel panel'>
                        <div className='panel-heading'>
                          <div>
                            <h2>Szybkie akcje</h2>
                            <p>Najczęściej używane działania.</p>
                          </div>
                        </div>
                        <button className='quick-action' onClick={() => setModal('collection')}>
                          <span className='action-icon yellow'>
                            <Plus size={19} />
                          </span>
                          <span>
                            <strong>Utwórz zbiórkę</strong>
                            <small>Dodaj nową zbiórkę pieniędzy</small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                        <button className='quick-action' onClick={() => setModal('student')}>
                          <span className='action-icon blue'>
                            <Users size={19} />
                          </span>
                          <span>
                            <strong>Dodaj ucznia</strong>
                            <small>Uzupełnij listę klasy</small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      </div>
                      <div className='class-info panel'>
                        <div className='class-info-top'>
                          <div>
                            <p className='eyebrow'>TWOJA KLASA</p>
                            <h2>{classData.name}</h2>
                          </div>
                          <button className='icon-button'>
                            <Settings size={17} />
                          </button>
                        </div>
                        <p>
                          {classData.description || 'Brak opisu klasy'}
                          <br />
                          Wychowawca: <strong>{classData.teacher}</strong>
                          <br />
                          Przewodniczący: <strong>{classData.chairperson?.name || classData.chairpersonName || 'Nie przypisano'}</strong>
                          <br />
                          Zastępca: <strong>{classData.deputy?.name || classData.deputyName || 'Nie przypisano'}</strong>
                        </p>
                        <div className='info-stats'>
                          <div>
                            <strong>{studentRows.length}</strong>
                            <span>uczniów</span>
                          </div>
                          <div>
                            <strong>{classData.chairperson ? '1' : '0'}</strong>
                            <span>przewodniczący</span>
                          </div>
                          <div>
                            <strong>{classData.name}</strong>
                            <span>klasa</span>
                          </div>
                        </div>
                      </div>
                    </aside>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>
      {modal && (
        <div className='modal-backdrop' onClick={() => setModal(null)}>
          <form className='modal' onSubmit={submit} onClick={(event) => event.stopPropagation()}>
            <div className='modal-heading'>
              <div>
                <p className='eyebrow'>{modal === 'class' ? 'NOWA KLASA' : modal === 'collection' && editingCollection ? 'EDYCJA ZBIÓRKI' : 'NOWY WPIS'}</p>
                <h2>{modal === 'class' ? 'Utwórz klasę' : modal === 'collection' ? (editingCollection ? 'Edytuj zbiórkę' : 'Utwórz zbiórkę') : 'Dodaj ucznia'}</h2>
              </div>
              <button type='button' className='icon-button' onClick={() => setModal(null)}>
                <X size={19} />
              </button>
            </div>
            {modal === 'class' ? (
              <>
                <label>
                  Nazwa klasy
                  <input required placeholder='np. 3B' />
                </label>
                <label>
                  Opis klasy
                  <textarea placeholder='Krótki opis klasy' rows='3' />
                </label>
                <RoleField label='Wychowawca' placeholder='Imię i nazwisko wychowawcy' inviteLabel='Zaproś wychowawcę' required />
                <RoleField label='Przewodniczący' placeholder='Imię i nazwisko przewodniczącego' inviteLabel='Zaproś przewodniczącego' />
                <RoleField label='Zastępca' placeholder='Imię i nazwisko zastępcy' inviteLabel='Zaproś zastępcę' />
              </>
            ) : modal === 'collection' ? (
              <>
                <label>
                  Nazwa zbiórki
                  <input required placeholder='np. Wycieczka klasowa' />
                </label>
                <div className='form-row'>
                  <label>
                    Data od
                    <input required type='date' />
                  </label>
                  <label>
                    Data do
                    <input required type='date' />
                  </label>
                </div>
                <label>
                  Kwota docelowa
                  <input required type='number' min='0.01' step='0.01' placeholder='1500' />
                </label>
                <label>
                  Uczniowie
                  <select>
                    <option>Wszyscy aktywni uczniowie ({studentRows.filter((student) => student.active).length})</option>
                    <option>Wybiorę uczniów później</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <div className='form-row'>
                  <label>
                    Imię
                    <input required placeholder='np. Jan' />
                  </label>
                  <label>
                    Nazwisko
                    <input required placeholder='np. Kowalski' />
                  </label>
                </div>
                <div className='form-row'>
                  <label>
                    Rodzic 1<input placeholder='Imię i nazwisko' />
                  </label>
                  <label>
                    Rodzic 2<input placeholder='Imię i nazwisko' />
                  </label>
                </div>
                <div className='form-row'>
                  <label>
                    Telefon rodzica 1
                    <input type='tel' placeholder='+48 000 000 000' />
                  </label>
                  <label>
                    Telefon rodzica 2
                    <input type='tel' placeholder='+48 000 000 000' />
                  </label>
                </div>
                <div className='form-row'>
                  <label>
                    E-mail rodzica 1
                    <input type='email' placeholder='rodzic@example.com' />
                  </label>
                  <label>
                    E-mail rodzica 2
                    <input type='email' placeholder='rodzic@example.com' />
                  </label>
                </div>
                <label>
                  Status
                  <select>
                    <option>Aktywny</option>
                    <option>Nieaktywny</option>
                  </select>
                </label>
              </>
            )}
            <button className='button primary full'>{modal === 'class' ? 'Utwórz klasę' : modal === 'collection' ? (editingCollection ? 'Zapisz zmiany' : 'Utwórz zbiórkę') : 'Dodaj ucznia'}</button>
          </form>
        </div>
      )}
      {pendingStatus && (
        <div className='modal-backdrop' onClick={() => setPendingStatus(null)}>
          <div className='confirm-modal' onClick={(event) => event.stopPropagation()}>
            <div className='confirm-icon'>
              <Power size={21} />
            </div>
            <h2>{pendingStatus.active ? 'Dezaktywować ucznia?' : 'Aktywować ucznia?'}</h2>
            <p>
              Czy na pewno chcesz {pendingStatus.active ? 'dezaktywować' : 'aktywować'} ucznia <strong>{pendingStatus.name}</strong>?
            </p>
            <div className='confirm-actions'>
              <button className='button secondary' onClick={() => setPendingStatus(null)}>
                Anuluj
              </button>
              <button className='button primary' onClick={toggleStudentStatus}>
                {pendingStatus.active ? 'Dezaktywuj' : 'Aktywuj'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className='toast'>✓ {toast}</div>}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);

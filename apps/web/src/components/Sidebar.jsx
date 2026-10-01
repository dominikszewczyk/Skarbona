import { useEffect, useRef } from 'react';
import { Check, ChevronDown, ClipboardList, LayoutDashboard, LogOut, Settings, Sparkles, Users, WalletCards, X } from 'lucide-react';

const navigation = [
  { label: 'Przegląd', path: '/overview', icon: LayoutDashboard },
  { label: 'Zbiórki', path: '/collections', icon: WalletCards },
  { label: 'Uczniowie', path: '/students', icon: Users },
  { label: 'Transakcje', path: '/transactions', icon: ClipboardList },
];

export default function Sidebar({ activeNav, classData, classes = [], activeClassId, collectionCount, hasClass, mobileOpen, onNavigate, onSelectClass, onClose }) {
  const classPickerRef = useRef(null);

  useEffect(() => {
    const closePickerOutside = (event) => {
      if (!classPickerRef.current?.contains(event.target)) classPickerRef.current.open = false;
    };
    document.addEventListener('pointerdown', closePickerOutside);
    return () => document.removeEventListener('pointerdown', closePickerOutside);
  }, []);

  return <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${!hasClass ? 'no-class' : ''} ${activeNav === 'Moja przestrzeń' ? 'workspace-view' : ''}`}>
    <div className="brand">
      <div className="brand-mark"><Sparkles size={19} /></div>
      <span>Skarbona</span>
      {mobileOpen && <button className="icon-button close-menu" onClick={onClose}><X size={18} /></button>}
    </div>
    <a className="workspace-label home-link" href="/" onClick={(event) => { event.preventDefault(); onNavigate('/'); }}>TWOJA PRZESTRZEŃ</a>
    <details className="class-picker" ref={classPickerRef}>
      <summary className="class-switcher">
        <span className="class-avatar"><Users size={16} /></span>
        <span><strong>Wybierz klasę</strong><small>{classes.length ? `${classes.length} ${classes.length === 1 ? 'dostępna klasa' : 'dostępne klasy'}` : 'Brak przypisanych klas'}</small></span>
        <ChevronDown className="class-picker-chevron" size={16} />
      </summary>
      <div className="class-picker-menu">
        {classes.length ? classes.map((item) => <button
          type="button"
          className="class-picker-option"
          key={item.id}
          aria-current={item.id === activeClassId ? 'true' : undefined}
          onClick={(event) => {
            event.currentTarget.closest('details').open = false;
            onSelectClass(item);
          }}
        >
          <span><strong>{item.name}</strong><small>{item.schoolYear || item.description || 'Klasa'}</small></span>
          {item.id === activeClassId && <Check size={16} />}
        </button>) : <p className="class-picker-empty">{classes.length ? 'Nie masz więcej klas.' : 'Nie masz jeszcze żadnej klasy.'}</p>}
      </div>
    </details>
    <nav>
      {navigation.map(({ label, path, icon: Icon }) => <button key={label} className={activeNav === label ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(path)}>
        <span><Icon size={18} /></span>
        {label}
        {label === 'Zbiórki' && <em>{collectionCount}</em>}
      </button>)}
    </nav>
    <div className="sidebar-bottom">
      <button className="nav-item"><Settings size={18} /> Ustawienia</button>
      <div className="user-card"><div className="user-avatar">DS</div><span><strong>Dominik Szewczyk</strong><small>Administrator</small></span><LogOut size={16} /></div>
    </div>
  </aside>;
}

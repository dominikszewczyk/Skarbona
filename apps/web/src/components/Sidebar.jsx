import { ChevronDown, ClipboardList, LayoutDashboard, LogOut, Settings, Sparkles, Users, WalletCards, X } from 'lucide-react';

const navigation = [
  { label: 'Przegląd', path: '/' , icon: LayoutDashboard },
  { label: 'Zbiórki', path: '/collections', icon: WalletCards },
  { label: 'Uczniowie', path: '/students', icon: Users },
  { label: 'Transakcje', path: '/transactions', icon: ClipboardList },
];

export default function Sidebar({ activeNav, classData, collectionCount, hasClass, mobileOpen, onNavigate, onClose }) {
  return <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${!hasClass ? 'no-class' : ''}`}>
    <div className="brand">
      <div className="brand-mark"><Sparkles size={19} /></div>
      <span>Skarbona</span>
      {mobileOpen && <button className="icon-button close-menu" onClick={onClose}><X size={18} /></button>}
    </div>
    <div className="workspace-label">TWOJA PRZESTRZEŃ</div>
    <button className="class-switcher">
      <span className="class-avatar">{classData.name?.slice(0, 2) || '—'}</span>
      <span><strong>{classData.name || 'Brak klasy'}</strong><small>{classData.description || 'Wybierz lub utwórz klasę'}</small></span>
      <ChevronDown size={16} />
    </button>
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

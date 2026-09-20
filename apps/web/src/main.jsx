import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownToLine, Bell, ChevronDown, ChevronRight, CircleHelp, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Sparkles, Users, WalletCards, X } from 'lucide-react';
import './styles.css';

const collections = [
  { name: 'Wycieczka klasowa', type: 'Wycieczka', dates: '01.09 – 30.09.2024', collected: 1230, target: 1500, spent: 850, students: 22, paid: 18, unpaid: ['Jan Kowalski', 'Oliwia Nowak', 'Mikołaj Wójcik', 'Lena Kamińska'] },
  { name: 'Materiały plastyczne', type: 'Materiały', dates: '01.09 – 15.09.2024', collected: 880, target: 880, spent: 310, students: 22, paid: 22, unpaid: [] },
  { name: 'Mikołajki 2024', type: 'Wydarzenie', dates: '01.11 – 06.12.2024', collected: 420, target: 660, spent: 0, students: 22, paid: 14, unpaid: ['Jan Kowalski', 'Tymon Zieliński', 'Oliwia Nowak', 'Mikołaj Wójcik', 'Lena Kamińska', 'Zuzanna Lis'] },
];
const students = ['Jan Kowalski', 'Zuzanna Lis', 'Antoni Mazur', 'Oliwia Nowak', 'Mikołaj Wójcik', 'Lena Kamińska'];
const money = (value) => `${value.toLocaleString('pl-PL')} zł`;

function App() {
  const [activeNav, setActiveNav] = useState('Przegląd');
  const [expanded, setExpanded] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const totalCollected = collections.reduce((sum, item) => sum + item.collected, 0);
  const totalSpent = collections.reduce((sum, item) => sum + item.spent, 0);

  const submit = (event) => {
    event.preventDefault();
    setModal(null);
    setToast(modal === 'collection' ? 'Zbiórka została utworzona.' : 'Uczeń został dodany do klasy.');
    setTimeout(() => setToast(''), 3000);
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><span>Skarbona</span>{mobileOpen && <button className="icon-button close-menu" onClick={() => setMobileOpen(false)}><X size={18} /></button>}</div>
      <div className="workspace-label">TWOJA PRZESTRZEŃ</div>
      <button className="class-switcher"><span className="class-avatar">3B</span><span><strong>Klasa 3B</strong><small>Szkoła Podstawowa nr 8</small></span><ChevronDown size={16} /></button>
      <nav>{['Przegląd', 'Zbiórki', 'Uczniowie'].map((item, index) => <button key={item} className={activeNav === item ? 'nav-item active' : 'nav-item'} onClick={() => { setActiveNav(item); setMobileOpen(false); }}><span>{[<LayoutDashboard size={18} />, <WalletCards size={18} />, <Users size={18} />][index]}</span>{item}{item === 'Zbiórki' && <em>3</em>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Settings size={18} />Ustawienia</button><div className="user-card"><div className="user-avatar">AK</div><span><strong>Anna Kowalska</strong><small>Skarbnik</small></span><LogOut size={16} /></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><div className="breadcrumbs"><span>Moja przestrzeń</span><ChevronRight size={15} /><strong>{activeNav}</strong></div><div className="top-actions"><button className="help-link"><CircleHelp size={17} /> Pomoc</button><button className="notification icon-button"><Bell size={18} /><i /></button><div className="top-avatar">AK</div></div></header>
      <div className="page-wrap">
        <section className="page-heading"><div><p className="eyebrow">PONIEDZIAŁEK, 9 GRUDNIA 2024</p><h1>Dzień dobry, Anno <span>✦</span></h1><p className="subheading">Oto co dzieje się w Twojej klasie.</p></div><div className="heading-actions"><button className="button secondary"><ArrowDownToLine size={17} /> Eksportuj</button><button className="button primary" onClick={() => setModal('collection')}><Plus size={18} /> Nowa zbiórka</button></div></section>
        <section className="summary-grid"><SummaryCard label="Saldo klasy" value={money(totalCollected - totalSpent)} detail="+12,4%" note="vs. poprzedni miesiąc" icon={<WalletCards size={21} />} tone="blue" /><SummaryCard label="Zebrano w tym roku" value={money(totalCollected)} detail="78%" note="z planowanych 3 900 zł" icon={<Sparkles size={21} />} tone="yellow" progress={78} /><SummaryCard label="Aktywne zbiórki" value="3" detail="2" note="wymagają uwagi" icon={<WalletCards size={21} />} tone="green" /></section>
        <section className="content-grid"><div className="collections-panel panel"><div className="panel-heading"><div><h2>Ostatnie zbiórki</h2><p>Monitoruj wpłaty i wydatki swojej klasy.</p></div><button className="text-button" onClick={() => setActiveNav('Zbiórki')}>Zobacz wszystkie <ChevronRight size={16} /></button></div><div className="table-header"><span>Nazwa zbiórki</span><span>Postęp wpłat</span><span>Bilans</span><span>Uczniowie</span><span /></div>{collections.map((item, index) => <CollectionRow key={item.name} item={item} expanded={expanded === index} onExpand={() => setExpanded(expanded === index ? -1 : index)} />)}</div><aside className="side-column"><div className="quick-panel panel"><div className="panel-heading"><div><h2>Szybkie akcje</h2><p>Najczęściej używane działania.</p></div></div><button className="quick-action" onClick={() => setModal('collection')}><span className="action-icon yellow"><Plus size={19} /></span><span><strong>Utwórz zbiórkę</strong><small>Dodaj nową zbiórkę pieniędzy</small></span><ChevronRight size={17} /></button><button className="quick-action" onClick={() => setModal('student')}><span className="action-icon blue"><Users size={19} /></span><span><strong>Dodaj ucznia</strong><small>Uzupełnij listę klasy</small></span><ChevronRight size={17} /></button></div><div className="class-info panel"><div className="class-info-top"><div><p className="eyebrow">TWOJA KLASA</p><h2>Klasa 3B</h2></div><button className="icon-button"><Settings size={17} /></button></div><p>Szkoła Podstawowa nr 8<br />Wychowawca: <strong>Maria Wiśniewska</strong></p><div className="info-stats"><div><strong>22</strong><span>uczniów</span></div><div><strong>3</strong><span>rada rodziców</span></div><div><strong>2024/25</strong><span>rok szkolny</span></div></div></div></aside></section>
      </div>
    </main>
    {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><form className="modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}><div className="modal-heading"><div><p className="eyebrow">NOWY WPIS</p><h2>{modal === 'collection' ? 'Utwórz zbiórkę' : 'Dodaj ucznia'}</h2></div><button type="button" className="icon-button" onClick={() => setModal(null)}><X size={19} /></button></div>{modal === 'collection' ? <><label>Nazwa zbiórki<input required placeholder="np. Wycieczka klasowa" /></label><div className="form-row"><label>Data od<input required type="date" /></label><label>Data do<input required type="date" /></label></div><label>Kwota docelowa<input required type="number" min="1" placeholder="1500" /></label><label>Uczniowie<select><option>Wszyscy aktywni uczniowie (22)</option><option>Wybiorę uczniów później</option></select></label></> : <><div className="form-row"><label>Imię<input required placeholder="np. Jan" /></label><label>Nazwisko<input required placeholder="np. Kowalski" /></label></div><label>Telefon rodzica<input required placeholder="+48 000 000 000" /></label><label>Status<select><option>Aktywny</option><option>Nieaktywny</option></select></label></>}<button className="button primary full">{modal === 'collection' ? 'Utwórz zbiórkę' : 'Dodaj ucznia'}</button></form></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </div>;
}

function SummaryCard({ label, value, detail, note, icon, tone, progress }) { return <div className="summary-card"><div className={`summary-icon ${tone}`}>{icon}</div><p>{label}</p><div className="summary-value">{value}</div><div className="summary-note"><span className={detail === '2' ? 'attention' : ''}>{detail}</span> {note}</div>{progress && <div className="progress"><span style={{ width: `${progress}%` }} /></div>}</div>; }
function CollectionRow({ item, expanded, onExpand }) { const progress = Math.round(item.collected / item.target * 100); return <div className={`collection-wrap ${expanded ? 'is-expanded' : ''}`}><button className="collection-row" onClick={onExpand}><span className="collection-title"><span className="collection-icon"><WalletCards size={18} /></span><span><strong>{item.name}</strong><small>{item.type} · {item.dates}</small></span></span><span className="payment-progress"><span className="progress-label"><b>{money(item.collected)}</b> / {money(item.target)}<small>{progress}%</small></span><span className="progress"><span style={{ width: `${progress}%` }} /></span></span><span className="balance"><strong>{money(item.collected - item.spent)}</strong><small>wydano {money(item.spent)}</small></span><span className="student-count"><strong>{item.paid} <small>/ {item.students}</small></strong><small>opłaciło</small></span><ChevronDown className={expanded ? 'rotate' : ''} size={18} /></button>{expanded && <div className="unpaid"><div><strong>Nieopłacone przez</strong><span>{item.unpaid.length ? `${item.unpaid.length} osób` : 'Wszyscy zapłacili'}</span></div><div className="name-list">{item.unpaid.length ? item.unpaid.map((student) => <span key={student}>{student}</span>) : <span className="paid-all">✓ Zbiórka zamknięta</span>}</div></div>}</div>; }

createRoot(document.getElementById('root')).render(<App />);

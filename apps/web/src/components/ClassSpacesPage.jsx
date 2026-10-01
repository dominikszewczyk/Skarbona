import { ArrowUpRight, Plus, UsersRound } from 'lucide-react';
import './ClassSpacesPage.css';

export default function ClassSpacesPage({ classes, onSelect, onCreate, onHome }) {
  return <section className="class-spaces-page">
    <header className="class-spaces-heading">
      <div>
        <p className="eyebrow">TWOJE KLASY</p>
        <h1><a className="home-link" href="/" onClick={(event) => { event.preventDefault(); onHome(); }}>Moja przestrzeń</a></h1>
        <p>Wybierz klasę, aby przejść do jej finansów i organizacji.</p>
      </div>
      <div className="class-spaces-heading-actions">
        <span className="class-spaces-count"><UsersRound size={17} /> {classes.length} {classes.length === 1 ? 'klasa' : 'klas'}</span>
        <button className="button primary" onClick={onCreate}><Plus size={17} /> Dodaj klasę</button>
      </div>
    </header>
    {classes.length ? <div className="class-spaces-grid">
      {classes.map((item) => <button className="class-space-tile" key={item.id} onClick={() => onSelect(item)}>
        <span className="class-space-mark"><UsersRound size={20} /></span>
        <span className="class-space-copy">
          <strong>{item.name}</strong>
          <small>{item.schoolYear || 'Rok szkolny nieustawiony'}</small>
          <span>{item.description || `Wychowawca: ${item.teacher || 'nie przypisano'}`}</span>
        </span>
        <ArrowUpRight className="class-space-arrow" size={18} />
      </button>)}
    </div> : <div className="class-spaces-empty">
      <UsersRound size={23} />
      <h2>Nie masz jeszcze przypisanych klas</h2>
      <p>Klasy, w których jesteś członkiem rady rodziców, pojawią się tutaj.</p>
    </div>}
  </section>;
}
export default function RoleField({ label, placeholder, inviteLabel, required = false }) {
  const fieldName = label === 'Wychowawca' ? 'teacher' : label === 'Przewodniczący' ? 'chairpersonName' : 'deputyName';
  return <div className="role-field"><label>{label}<input name={fieldName} required={required} placeholder={placeholder} /></label><button type="button" className="invite-button" disabled title="Funkcja dostepna w przyszlosci.">{inviteLabel}</button></div>;
}

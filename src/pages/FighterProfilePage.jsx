import { Link } from '../router';

export default function FighterProfilePage({ id }) {
  return (
    <div className="page-content">
      <Link to="/fighters" className="profile-back">{'\u2190'} BACK TO FIGHTERS</Link>
      <div className="page-header">
        <h1 className="page-title">{id.toUpperCase()}</h1>
        <p className="page-subtitle">Fighter profile coming soon</p>
      </div>
    </div>
  );
}

import { Link, useLocation } from '../router';

function getDayNumber() {
  const now = new Date();
  const start = new Date(2026, 1, 22);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.floor((today - start) / 86400000) + 1);
}

const NAV_LINKS = [
  { to: '/', label: 'ARENA' },
  { to: '/standings', label: 'STANDINGS' },
  { to: '/fighters', label: 'FIGHTERS' },
  { to: '/last-battle', label: 'LAST BATTLE' },
];

function isLinkActive(to, pathname) {
  if (to === '/') return pathname === '/';
  return pathname.startsWith(to);
}

export default function TopNav({ live = false, simulating = false }) {
  const { pathname } = useLocation();
  const day = getDayNumber();

  let centerEl;
  if (simulating) {
    centerEl = <span className="topnav-sim">SIMULATION</span>;
  } else if (live) {
    centerEl = <span className="topnav-live">{'\u25CF'} LIVE</span>;
  } else {
    centerEl = <span className="topnav-center">S1 // DAY {day}</span>;
  }

  return (
    <nav className="topnav">
      <Link to="/" className="topnav-logo">{'\u2694'} LLM COLOSSEUM {'\u2694'}</Link>
      {centerEl}
      <div className="topnav-links">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`topnav-link${isLinkActive(to, pathname) ? ' topnav-link-active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

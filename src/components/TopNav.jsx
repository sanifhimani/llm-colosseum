import { useState } from 'react';
import { Link, useLocation } from '../router';

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

export default function TopNav({ live = false, simulating = false, totalBattles = null }) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const day = totalBattles != null ? totalBattles + 1 : null;

  let centerEl;
  if (simulating) {
    centerEl = <span className="topnav-sim">SIMULATION</span>;
  } else if (live) {
    centerEl = <span className="topnav-live">{'\u25CF'} LIVE</span>;
  } else if (day) {
    centerEl = <span className="topnav-center">S1 // DAY {day}</span>;
  } else {
    centerEl = <span className="topnav-center">S1</span>;
  }

  return (
    <nav className="topnav">
      <Link to="/" className="topnav-logo">{'\u2694'} LLM COLOSSEUM {'\u2694'}</Link>
      {centerEl}
      <button
        className="topnav-hamburger"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>
      <div className={`topnav-links${menuOpen ? ' topnav-links-open' : ''}`}>
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`topnav-link${isLinkActive(to, pathname) ? ' topnav-link-active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {label}
          </Link>
        ))}
        <a
          href="https://github.com/sanifhimani/llm-colosseum"
          target="_blank"
          rel="noopener noreferrer"
          className="topnav-link"
        >
          GITHUB
        </a>
      </div>
    </nav>
  );
}

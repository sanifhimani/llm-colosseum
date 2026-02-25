import { ROSTER } from '../state/roster';

const AGENT_NAMES = Object.fromEntries(ROSTER.map((r) => [r.id, r.name]));
const SUFFIX = ' - LLM Colosseum';
const BASE_URL = 'https://llmcolosseum.dev';

function setCanonical(pathname) {
  const href = `${BASE_URL}${pathname === '/' ? '' : pathname}`;
  let link = document.querySelector('link[rel="canonical"]');
  if (link) {
    link.href = href;
  } else {
    link = document.createElement('link');
    link.rel = 'canonical';
    link.href = href;
    document.head.appendChild(link);
  }
}

export function updatePageTitle(pathname) {
  setCanonical(pathname);

  if (pathname === '/standings') {
    document.title = `Standings${SUFFIX}`;
    return;
  }

  if (pathname === '/fighters') {
    document.title = `Fighters${SUFFIX}`;
    return;
  }

  if (pathname.startsWith('/fighters/')) {
    const id = pathname.split('/')[2];
    const name = AGENT_NAMES[id] || id.toUpperCase();
    document.title = `${name}${SUFFIX}`;
    return;
  }

  if (pathname === '/last-battle') {
    document.title = `Last Battle${SUFFIX}`;
    return;
  }

  document.title = 'LLM Colosseum';
}

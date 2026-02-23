/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

const RouterContext = createContext(null);

function createRouterStore() {
  let listeners = new Set();
  const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
  const getSnapshot = () => window.location.pathname + window.location.search;
  const notify = () => listeners.forEach((cb) => cb());

  window.addEventListener('popstate', notify);

  function navigate(to, { replace = false } = {}) {
    if (replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    notify();
  }

  return { subscribe, getSnapshot, navigate };
}

let store = null;
function getStore() {
  if (!store) store = createRouterStore();
  return store;
}

export function RouterProvider({ children }) {
  const router = useMemo(() => getStore(), []);
  const snapshot = useSyncExternalStore(router.subscribe, router.getSnapshot);

  const [pathname, search] = useMemo(() => {
    const url = new URL(snapshot, window.location.origin);
    return [url.pathname, url.search];
  }, [snapshot]);

  const value = useMemo(() => ({
    pathname,
    search,
    navigate: router.navigate,
  }), [pathname, search, router.navigate]);

  return <RouterContext value={value}>{children}</RouterContext>;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  return { pathname: ctx.pathname, search: ctx.search };
}

export function useNavigate() {
  const ctx = useContext(RouterContext);
  return ctx.navigate;
}

export function matchRoute(pattern, pathname) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function Link({ to, children, className, ...rest }) {
  const navigate = useNavigate();

  const handleClick = useCallback((e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  }, [to, navigate]);

  return (
    <a href={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}

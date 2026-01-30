import { useState, useEffect } from 'react';
import { parseHash } from '@/lib/router';
import type { RouteInfo } from '@/types';

/**
 * Hook to track hash-based routing
 * Returns current route information and updates on hash changes
 */
export function useRouter(): RouteInfo {
  const [route, setRoute] = useState<RouteInfo>(parseHash);

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseHash());
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}

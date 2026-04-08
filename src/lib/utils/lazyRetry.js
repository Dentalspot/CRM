import { lazy } from 'react';

/**
 * Wraps React.lazy with automatic retry + page reload on chunk load failure.
 * After a deploy, old cached chunks 404. This catches the error and reloads once.
 */
export default function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch((error) => {
      const key = 'chunk_reload';
      const hasReloaded = sessionStorage.getItem(key);

      if (!hasReloaded) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        // Return a never-resolving promise to prevent flash of error
        return new Promise(() => {});
      }

      // Already reloaded once — clear flag and let ErrorBoundary handle it
      sessionStorage.removeItem(key);
      throw error;
    })
  );
}

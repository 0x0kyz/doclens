import { useCallback, useEffect } from 'react';
import { useDocViewerContext } from '../context/DocViewerContext';

export function useSearch() {
  const { state, actions } = useDocViewerContext();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl/Cmd+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('.dv-search-input');
        input?.focus();
        return;
      }

      // Escape to clear search
      if (e.key === 'Escape' && state.searchQuery) {
        actions.clearSearch();
        return;
      }

      // Enter to navigate matches
      if (e.key === 'Enter' && state.searchResults.length > 0) {
        const target = e.target as HTMLElement;
        if (target.classList.contains('dv-search-input')) {
          e.preventDefault();
          if (e.shiftKey) {
            actions.prevMatch();
          } else {
            actions.nextMatch();
          }
        }
      }
    },
    [state.searchQuery, state.searchResults.length, actions],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    query: state.searchQuery,
    results: state.searchResults,
    activeIndex: state.activeSearchIndex,
    count: state.searchResults.length,
    search: actions.search,
    nextMatch: actions.nextMatch,
    prevMatch: actions.prevMatch,
    clearSearch: actions.clearSearch,
  };
}

import React, { useRef, useCallback } from 'react';
import { useDocViewerContext } from '../context/DocViewerContext';

export interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export function SearchBar({ className, placeholder = 'Search...' }: SearchBarProps) {
  const { state, actions } = useDocViewerContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        actions.search(value);
      }, 200);
    },
    [actions],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          actions.prevMatch();
        } else {
          actions.nextMatch();
        }
      }
      if (e.key === 'Escape') {
        actions.clearSearch();
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [actions],
  );

  const hasResults = state.searchResults.length > 0;
  const showNav = state.searchQuery.length > 0;
  const isOCRProcessing = state.isOCRProcessing;

  return (
    <div className={`dv-search-bar ${className ?? ''}`}>
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style={{ opacity: 0.5, flexShrink: 0 }}>
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
      </svg>

      <input
        ref={inputRef}
        type="text"
        className="dv-search-input"
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label="Search document"
      />

      {showNav && (
        <div className="dv-search-nav">
          <span className="dv-search-count">
            {hasResults
              ? `${state.activeSearchIndex + 1} of ${state.searchResults.length}${isOCRProcessing ? '+' : ''}`
              : isOCRProcessing ? 'Scanning...' : 'No results'}
            {isOCRProcessing && (
              <span className="dv-ocr-indicator" title="Scanning images for text (OCR)...">
                <svg className="dv-ocr-spinner" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" opacity="0.25" />
                  <path d="M14 8a6 6 0 0 0-6-6" />
                </svg>
              </span>
            )}
          </span>

          <button
            className="dv-btn"
            onClick={actions.prevMatch}
            disabled={!hasResults}
            aria-label="Previous match"
            title="Previous match (Shift+Enter)"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
              <path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
            </svg>
          </button>

          <button
            className="dv-btn"
            onClick={actions.nextMatch}
            disabled={!hasResults}
            aria-label="Next match"
            title="Next match (Enter)"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
              <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>

          <button
            className="dv-btn"
            onClick={() => {
              actions.clearSearch();
              if (inputRef.current) inputRef.current.value = '';
            }}
            aria-label="Clear search"
            title="Clear (Escape)"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useDocViewerContext } from '../context/DocViewerContext';
import { extractFileName } from '../../core/source-resolver';

export interface DocumentTabsProps {
  className?: string;
}

export function DocumentTabs({ className }: DocumentTabsProps) {
  const { state, actions } = useDocViewerContext();

  if (state.documents.length <= 1) return null;

  return (
    <div className={`dv-tabs ${className ?? ''}`}>
      {state.documents.map((doc, i) => (
        <button
          key={i}
          className={`dv-tab ${i === state.activeDocIndex ? 'dv-tab--active' : ''}`}
          onClick={() => actions.loadDocument(i)}
          title={extractFileName(doc)}
        >
          {extractFileName(doc)}
        </button>
      ))}
    </div>
  );
}

import React from 'react';
import { useDocViewerContext } from '../context/DocViewerContext';

export interface ZoomControlsProps {
  className?: string;
}

export function ZoomControls({ className }: ZoomControlsProps) {
  const { state, actions } = useDocViewerContext();
  const percentage = Math.round(state.zoom * 100);

  return (
    <div className={`dv-zoom-controls ${className ?? ''}`}>
      <button
        className="dv-btn"
        onClick={actions.zoomOut}
        aria-label="Zoom out"
        title="Zoom out (Ctrl+-)"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
        </svg>
      </button>

      <span className="dv-zoom-label">{percentage}%</span>

      <button
        className="dv-btn"
        onClick={actions.zoomIn}
        aria-label="Zoom in"
        title="Zoom in (Ctrl++)"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
      </button>

      <button
        className="dv-btn"
        onClick={actions.resetZoom}
        aria-label="Reset zoom"
        title="Reset zoom (Ctrl+0)"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
        </svg>
      </button>
    </div>
  );
}

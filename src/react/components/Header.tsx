import React from 'react';
import { useDocViewerContext } from '../context/DocViewerContext';
import { SearchBar } from './SearchBar';
import { ZoomControls } from './ZoomControls';

export interface HeaderProps {
  className?: string;
  renderLeft?: () => React.ReactNode;
  renderCenter?: () => React.ReactNode;
  renderRight?: () => React.ReactNode;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  xlsx: '📊',
  xls: '📊',
  csv: '📊',
  pptx: '📽',
  docx: '📝',
  xml: '📋',
  json: '{ }',
  html: '🌐',
  markdown: '📑',
  image: '🖼',
  video: '🎬',
  audio: '🎵',
  text: '📄',
};

export function Header({ className, renderLeft, renderCenter, renderRight }: HeaderProps) {
  const { state, actions } = useDocViewerContext();
  const { headerConfig, meta, fileType, pageCount, currentPage } = state;

  if (!headerConfig.show) return null;

  return (
    <div className={`dv-header ${className ?? ''}`}>
      {/* Left section */}
      <div className="dv-header-left">
        {renderLeft ? (
          renderLeft()
        ) : (
          headerConfig.fileName && meta && (
            <>
              <span style={{ fontSize: '16px' }}>
                {FILE_TYPE_ICONS[fileType ?? 'text'] ?? '📄'}
              </span>
              <span className="dv-file-name" title={meta.fileName}>
                {meta.fileName}
              </span>
            </>
          )
        )}
      </div>

      {/* Center section */}
      <div className="dv-header-center">
        {renderCenter ? renderCenter() : headerConfig.search && <SearchBar />}
      </div>

      {/* Right section */}
      <div className="dv-header-right">
        {renderRight ? (
          renderRight()
        ) : (
          <>
            {/* Page navigation */}
            {headerConfig.pageNav && pageCount > 1 && (
              <div className="dv-search-nav">
                <button
                  className="dv-btn"
                  onClick={() => actions.goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <path d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z" />
                  </svg>
                </button>
                <span className="dv-zoom-label" style={{ minWidth: 60 }}>
                  {currentPage} / {pageCount}
                </span>
                <button
                  className="dv-btn"
                  onClick={() => actions.goToPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  aria-label="Next page"
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                    <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z" />
                  </svg>
                </button>
              </div>
            )}

            {headerConfig.zoom && <ZoomControls />}

            {/* Rotate */}
            <button
              className="dv-btn"
              onClick={() => actions.rotate(90)}
              aria-label="Rotate"
              title="Rotate 90°"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2V3z" />
                <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z" />
              </svg>
            </button>

            {/* Download */}
            {headerConfig.download && (
              <button
                className="dv-btn"
                onClick={actions.download}
                aria-label="Download"
                title="Download"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z" />
                </svg>
              </button>
            )}

            {/* Print */}
            {headerConfig.print && (
              <button
                className="dv-btn"
                onClick={actions.print}
                aria-label="Print"
                title="Print"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                  <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" />
                  <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5zm6 8H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z" />
                  <path d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7z" />
                </svg>
              </button>
            )}

            {/* Fullscreen */}
            {headerConfig.fullscreen && (
              <button
                className="dv-btn"
                onClick={actions.toggleFullscreen}
                aria-label="Fullscreen"
                title="Toggle fullscreen"
              >
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                  <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useRef, useState, useCallback, useMemo } from 'react';
import type {
  DocumentSource,
  DocumentMeta,
  SearchResult,
  ThemePreset,
  ThemeConfig,
  HeaderConfig,
} from '../core/types';
import { DocViewerContext } from './context/DocViewerContext';
import { useDocViewer } from './hooks/useDocViewer';
import { Header } from './components/Header';
import { DocumentTabs } from './components/DocumentTabs';

import './styles/docviewer.css';

export interface DocViewerProps {
  document?: DocumentSource;
  documents?: DocumentSource[];
  activeDocument?: number;

  initialSearchTerms?: string[];

  theme?: ThemePreset | ThemeConfig;
  header?: boolean | HeaderConfig;

  defaultZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;

  disableSelection?: boolean;
  disablePrint?: boolean;

  /** Enable OCR for images and scanned PDFs. Disabled by default (requires tesseract.js). */
  enableOCR?: boolean;

  onDocumentLoad?: (meta: DocumentMeta) => void;
  onDocumentChange?: (index: number, doc: DocumentSource) => void;
  onError?: (error: Error) => void;
  onSearchChange?: (query: string, results: SearchResult[]) => void;
  onDrop?: (files: File[]) => void;

  renderHeaderLeft?: () => React.ReactNode;
  renderHeaderCenter?: () => React.ReactNode;
  renderHeaderRight?: () => React.ReactNode;

  className?: string;
  style?: React.CSSProperties;
  height?: string | number;
  width?: string | number;
}

export function DocViewer({
  document: doc,
  documents,
  activeDocument,
  initialSearchTerms,
  theme = 'light',
  header,
  defaultZoom,
  minZoom,
  maxZoom,
  zoomStep,
  disableSelection,
  disablePrint,
  enableOCR,
  onDocumentLoad,
  onDocumentChange,
  onError,
  onSearchChange,
  onDrop,
  renderHeaderLeft,
  renderHeaderCenter,
  renderHeaderRight,
  className,
  style,
  height = '100%',
  width = '100%',
}: DocViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { state, actions } = useDocViewer(contentRef, viewerRef, {
    document: doc,
    documents,
    activeDocument,
    initialSearchTerms,
    theme,
    header,
    defaultZoom,
    minZoom,
    maxZoom,
    zoomStep,
    disableSelection,
    disablePrint,
    enableOCR,
    onDocumentLoad,
    onDocumentChange,
    onError,
    onSearchChange,
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && onDrop) {
        onDrop(files);
      }
    },
    [onDrop],
  );

  const themeAttr = useMemo(() => {
    if (typeof theme === 'string') return theme;
    if (typeof theme === 'object' && theme.preset) return theme.preset;
    return 'light';
  }, [theme]);

  const customVars = useMemo<React.CSSProperties>(() => {
    if (typeof theme === 'object' && theme.variables) {
      const vars: Record<string, string> = {};
      for (const [key, value] of Object.entries(theme.variables)) {
        vars[key] = value;
      }
      return vars as React.CSSProperties;
    }
    return {};
  }, [theme]);

  const rootStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: typeof width === 'number' ? `${width}px` : width,
    ...customVars,
    ...style,
  };

  const allDocs = documents ?? (doc ? [doc] : []);

  return (
    <DocViewerContext.Provider value={{ state, actions }}>
      <div
        className={`dv-root ${disableSelection ? 'dv-no-select' : ''} ${disablePrint ? 'dv-no-print' : ''} ${className ?? ''}`}
        data-dv-theme={themeAttr}
        style={rootStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Header
          renderLeft={renderHeaderLeft}
          renderCenter={renderHeaderCenter}
          renderRight={renderHeaderRight}
        />

        {allDocs.length > 1 && <DocumentTabs />}

        <div className="dv-body">
          <div className="dv-viewer-container" ref={viewerRef}>
            <div className="dv-content" ref={contentRef} />
          </div>
        </div>

        {isDragOver && (
          <div className="dv-drop-overlay">Drop file here to open</div>
        )}
      </div>
    </DocViewerContext.Provider>
  );
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { DocViewerEngine } from '../../core/engine';
import type {
  DocViewerOptions,
  DocumentSource,
  DocumentMeta,
  FileType,
  SearchResult,
  HeaderConfig,
  ThemePreset,
  ThemeConfig,
} from '../../core/types';
import type { DocViewerState, DocViewerActions } from '../context/DocViewerContext';

export interface UseDocViewerProps {
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
  enableOCR?: boolean;
  onDocumentLoad?: (meta: DocumentMeta) => void;
  onDocumentChange?: (index: number, doc: DocumentSource) => void;
  onError?: (error: Error) => void;
  onSearchChange?: (query: string, results: SearchResult[]) => void;
}

function resolveHeaderConfig(header?: boolean | HeaderConfig): HeaderConfig {
  if (header === false) return { show: false };
  if (header === true || header === undefined) {
    return {
      show: true,
      fileName: true,
      search: true,
      zoom: true,
      fullscreen: true,
      download: true,
      print: true,
      pageNav: true,
    };
  }
  return { show: true, ...header };
}

export function useDocViewer(
  contentRef: React.RefObject<HTMLElement | null>,
  viewerRef: React.RefObject<HTMLElement | null>,
  props: UseDocViewerProps,
) {
  const engineRef = useRef<DocViewerEngine | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<DocumentMeta | null>(null);
  const [fileType, setFileType] = useState<FileType | null>(null);

  const [activeDocIndex, setActiveDocIndex] = useState(props.activeDocument ?? 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [zoom, setZoomState] = useState(props.defaultZoom ?? 1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  const allDocs: DocumentSource[] = props.documents ?? (props.document ? [props.document] : []);
  const headerConfig = resolveHeaderConfig(props.header);
  const theme: ThemePreset | ThemeConfig = props.theme ?? 'light';

  const docsKey = JSON.stringify(allDocs.map((d) => d.uri ?? d.fileName ?? ''));

  // Initialize engine (headless mode — React owns the layout)
  useEffect(() => {
    const contentEl = contentRef.current;
    const viewerEl = viewerRef.current;
    if (!contentEl || !viewerEl || allDocs.length === 0) return;

    const options: DocViewerOptions = {
      documents: allDocs,
      activeDocument: activeDocIndex,
      initialSearchTerms: props.initialSearchTerms,
      theme,
      defaultZoom: props.defaultZoom,
      minZoom: props.minZoom,
      maxZoom: props.maxZoom,
      zoomStep: props.zoomStep,
      disableSelection: props.disableSelection,
      disablePrint: props.disablePrint,
      enableOCR: props.enableOCR,
      onDocumentLoad: (m) => {
        setMeta(m);
        setFileType(m.fileType);
        setPageCount(m.pageCount ?? 1);
        setCurrentPage(1);
        setIsLoading(false);
        props.onDocumentLoad?.(m);
      },
      onError: (err) => {
        setError(err.message);
        setIsLoading(false);
        props.onError?.(err);
      },
      onSearchChange: (q, results) => {
        setSearchResults(results);
        setActiveSearchIndex(results.length > 0 ? 0 : -1);
        props.onSearchChange?.(q, results);
      },
      onDocumentChange: (idx, doc) => {
        setActiveDocIndex(idx);
        props.onDocumentChange?.(idx, doc);
      },
      onOCRProgress: (processing) => {
        setIsOCRProcessing(processing);
      },
    };

    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const engine = new DocViewerEngine(contentEl, options, {
      mode: 'headless',
      viewerEl,
    });
    engineRef.current = engine;

    setIsLoading(true);
    setError(null);
    engine.load().catch(() => {});

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsKey]);

  // Actions
  const loadDocument = useCallback(async (index: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    setIsLoading(true);
    setError(null);
    await engine.loadDocument(index);
  }, []);

  const search = useCallback((query: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    setSearchQuery(query);
    if (!query) {
      engine.clearSearch();
      setSearchResults([]);
      setActiveSearchIndex(-1);
      return;
    }
    const results = engine.search(query);
    setSearchResults(results);
    setActiveSearchIndex(results.length > 0 ? 0 : -1);
  }, []);

  const nextMatch = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const idx = engine.nextMatch();
    setActiveSearchIndex(idx);
  }, []);

  const prevMatch = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const idx = engine.prevMatch();
    setActiveSearchIndex(idx);
  }, []);

  const clearSearch = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.clearSearch();
    setSearchQuery('');
    setSearchResults([]);
    setActiveSearchIndex(-1);
  }, []);

  const setZoom = useCallback((level: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setZoom(level);
    setZoomState(level);
  }, []);

  const zoomIn = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.zoomIn();
    setZoomState(engine.getZoom());
  }, []);

  const zoomOut = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.zoomOut();
    setZoomState(engine.getZoom());
  }, []);

  const resetZoom = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.resetZoom();
    setZoomState(1);
  }, []);

  const fitToWidth = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.fitToWidth();
    setZoomState(engine.getZoom());
  }, []);

  const goToPage = useCallback((page: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.goToPage(page);
    setCurrentPage(page);
  }, []);

  const rotate = useCallback((degrees = 90) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.rotate(degrees);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const rootEl = contentRef.current?.closest('.dv-root') as HTMLElement | null;
    if (!rootEl) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      rootEl.requestFullscreen();
    }
  }, [contentRef]);

  const download = useCallback(() => {
    const doc = allDocs[activeDocIndex];
    if (!doc) return;

    if (doc.uri && !doc.uri.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = doc.uri;
      a.download = doc.fileName ?? 'document';
      a.click();
      return;
    }

    const engine = engineRef.current;
    if (!engine) return;

    const data = engine.getCurrentData();
    if (data) {
      const blob = new Blob([data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName ?? 'document';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [allDocs, activeDocIndex]);

  const print = useCallback(() => {
    window.print();
  }, []);

  const state: DocViewerState = {
    engine: engineRef.current,
    isLoading,
    error,
    meta,
    fileType,
    documents: allDocs,
    activeDocIndex,
    searchQuery,
    searchResults,
    activeSearchIndex,
    isOCRProcessing,
    zoom,
    currentPage,
    pageCount,
    theme,
    headerConfig,
  };

  const actions: DocViewerActions = {
    loadDocument,
    search,
    nextMatch,
    prevMatch,
    clearSearch,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToWidth,
    goToPage,
    rotate,
    toggleFullscreen,
    download,
    print,
  };

  return { state, actions };
}

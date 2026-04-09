import { createContext, useContext } from 'react';
import type { DocViewerEngine } from '../../core/engine';
import type {
  DocumentSource,
  DocumentMeta,
  FileType,
  SearchResult,
  HeaderConfig,
  ThemePreset,
  ThemeConfig,
} from '../../core/types';

export interface DocViewerState {
  engine: DocViewerEngine | null;
  isLoading: boolean;
  error: string | null;
  meta: DocumentMeta | null;
  fileType: FileType | null;

  documents: DocumentSource[];
  activeDocIndex: number;

  searchQuery: string;
  searchResults: SearchResult[];
  activeSearchIndex: number;
  isOCRProcessing: boolean;

  zoom: number;
  currentPage: number;
  pageCount: number;

  theme: ThemePreset | ThemeConfig;
  headerConfig: HeaderConfig;
}

export interface DocViewerActions {
  loadDocument: (index: number) => Promise<void>;
  search: (query: string) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  clearSearch: () => void;
  setZoom: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fitToWidth: () => void;
  goToPage: (page: number) => void;
  rotate: (degrees?: number) => void;
  toggleFullscreen: () => void;
  download: () => void;
  print: () => void;
}

export interface DocViewerContextValue {
  state: DocViewerState;
  actions: DocViewerActions;
}

export const DocViewerContext = createContext<DocViewerContextValue | null>(null);

export function useDocViewerContext(): DocViewerContextValue {
  const ctx = useContext(DocViewerContext);
  if (!ctx) {
    throw new Error('useDocViewerContext must be used within a DocViewer component');
  }
  return ctx;
}

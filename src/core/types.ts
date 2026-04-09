/* ------------------------------------------------------------------ */
/*  Document Source                                                    */
/* ------------------------------------------------------------------ */

export interface DocumentSource {
  uri?: string;
  fileData?: ArrayBuffer | Blob | Uint8Array | File;
  fileName?: string;
  fileType?: string;
  requestInit?: RequestInit;
}

/* ------------------------------------------------------------------ */
/*  File Types                                                         */
/* ------------------------------------------------------------------ */

export type FileType =
  | 'pdf'
  | 'xlsx'
  | 'xls'
  | 'csv'
  | 'pptx'
  | 'docx'
  | 'xml'
  | 'json'
  | 'html'
  | 'markdown'
  | 'image'
  | 'video'
  | 'audio'
  | 'text';

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

export interface SearchResult {
  index: number;
  node: HTMLElement;
  text: string;
  page?: number;
  termIndex?: number;
}

export interface ISearchable {
  search(query: string, options?: SearchOptions): SearchResult[];
  highlightMatch(index: number): void;
  clearHighlights(): void;
  getSearchResults(): SearchResult[];
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  termIndex?: number;
}

/* ------------------------------------------------------------------ */
/*  Renderer                                                           */
/* ------------------------------------------------------------------ */

export interface RendererContext {
  container: HTMLElement;
  data: ArrayBuffer;
  source: DocumentSource;
  fileType: FileType;
  enableOCR: boolean;
  onError: (error: Error) => void;
}

export interface IRenderer extends ISearchable {
  render(ctx: RendererContext): Promise<void>;
  destroy(): void;
  getContainer(): HTMLElement | null;

  setZoom?(level: number): void;
  getPageCount?(): number;
  getCurrentPage?(): number;
  goToPage?(page: number): void;
  getOutline?(): OutlineItem[];
  setPassword?(password: string): Promise<boolean>;
  rotate?(degrees: number): void;
  getTextContent?(): string;
}

export interface OutlineItem {
  title: string;
  page?: number;
  children?: OutlineItem[];
  dest?: unknown;
}

export type RendererConstructor = new () => IRenderer;

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */

export type ThemePreset = 'light' | 'dark';

export interface ThemeConfig {
  preset?: ThemePreset;
  variables?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Header / Toolbar Configuration                                     */
/* ------------------------------------------------------------------ */

export interface HeaderConfig {
  show?: boolean;
  fileName?: boolean;
  search?: boolean;
  zoom?: boolean;
  fullscreen?: boolean;
  download?: boolean;
  print?: boolean;
  pageNav?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Doc Viewer Options (vanilla core)                                  */
/* ------------------------------------------------------------------ */

export interface DocViewerOptions {
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

  /** Enable OCR for images and scanned PDFs (disabled by default — requires tesseract.js). */
  enableOCR?: boolean;

  plugins?: RendererConstructor[];

  onDocumentLoad?: (meta: DocumentMeta) => void;
  onDocumentChange?: (index: number, doc: DocumentSource) => void;
  onError?: (error: Error) => void;
  onSearchChange?: (query: string, results: SearchResult[]) => void;
  onOCRProgress?: (processing: boolean) => void;
}

export interface DocumentMeta {
  fileName: string;
  fileType: FileType;
  pageCount?: number;
  fileSize: number;
}

/* ------------------------------------------------------------------ */
/*  Events                                                             */
/* ------------------------------------------------------------------ */

export type DocViewerEvent =
  | 'load'
  | 'error'
  | 'search'
  | 'zoom'
  | 'pageChange'
  | 'documentChange'
  | 'ocrProgress';

export interface DocViewerEventMap {
  load: DocumentMeta;
  error: Error;
  search: { query: string; results: SearchResult[] };
  zoom: { level: number };
  pageChange: { page: number };
  documentChange: { index: number; document: DocumentSource };
  ocrProgress: { processing: boolean };
}

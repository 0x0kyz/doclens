import type {
  DocViewerOptions,
  DocumentSource,
  DocumentMeta,
  FileType,
  IRenderer,
  DocViewerEventMap,
  DocViewerEvent,
  SearchResult,
} from './types';
import { resolveSource, extractFileName } from './source-resolver';
import { detectFileType } from './file-detection';
import { getRenderer, registerRenderer } from './renderers/registry';
import { SearchEngine } from './search/SearchEngine';
import { ZoomManager } from './zoom/ZoomManager';
import { createElement, clearElement } from './utils/dom';

type EventCallback<T> = (data: T) => void;

export interface EngineMode {
  /**
   * "managed" (default): engine creates its own .dv-root > .dv-viewer-container > .dv-content structure.
   * "headless": engine only renders document content into the provided container (no chrome).
   */
  mode: 'managed' | 'headless';
  /** For headless mode: the scrollable container wrapping the content element (used by ZoomManager). */
  viewerEl?: HTMLElement;
}

export class DocViewerEngine {
  private container: HTMLElement;
  private options: DocViewerOptions;
  private renderer: IRenderer | null = null;
  private searchEngine = new SearchEngine();
  private zoomManager: ZoomManager;

  private rootEl: HTMLElement | null = null;
  private contentEl: HTMLElement;
  private viewerEl: HTMLElement;
  private engineMode: EngineMode;

  private activeDocIndex = 0;
  private currentSource: DocumentSource | null = null;
  private currentData: ArrayBuffer | null = null;
  private currentFileType: FileType | null = null;
  private currentMeta: DocumentMeta | null = null;

  private listeners = new Map<string, Set<EventCallback<any>>>();
  private isDestroyed = false;

  constructor(container: HTMLElement, options: DocViewerOptions = {}, engineMode?: EngineMode) {
    this.container = container;
    this.options = options;
    this.activeDocIndex = options.activeDocument ?? 0;
    this.engineMode = engineMode ?? { mode: 'managed' };

    this.zoomManager = new ZoomManager({
      defaultZoom: options.defaultZoom,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      zoomStep: options.zoomStep,
    });

    if (this.engineMode.mode === 'headless') {
      this.contentEl = container;
      this.viewerEl = engineMode?.viewerEl ?? container;
    } else {
      this.rootEl = createElement('div', 'dv-root', container);
      this.viewerEl = createElement('div', 'dv-viewer-container', this.rootEl);
      this.contentEl = createElement('div', 'dv-content', this.viewerEl);
      this.applyTheme();
      this.applyProtection();
    }
  }

  async load(source?: DocumentSource): Promise<void> {
    if (this.isDestroyed) return;

    const doc = source ?? this.getActiveDocument();
    if (!doc) throw new Error('No document source provided');

    this.currentSource = doc;

    try {
      this.showLoading();

      this.currentData = await resolveSource(doc);
      this.currentFileType = detectFileType(doc, this.currentData);

      if (this.renderer) {
        this.renderer.destroy();
      }

      this.renderer = await getRenderer(this.currentFileType);

      clearElement(this.contentEl);

      await this.renderer.render({
        container: this.contentEl,
        data: this.currentData,
        source: doc,
        fileType: this.currentFileType,
        enableOCR: this.options.enableOCR ?? false,
        onError: (err) => this.emit('error', err),
      });

      this.searchEngine.setContainer(this.contentEl);
      if (this.renderer) {
        this.searchEngine.setSearchable(this.renderer);
      }

      // If the renderer started eager OCR, wire up the completion callback
      this.setupOCRCallback();

      this.zoomManager.attach(this.viewerEl, this.contentEl, (level) => {
        this.emit('zoom', { level });
      });

      this.currentMeta = {
        fileName: extractFileName(doc),
        fileType: this.currentFileType,
        pageCount: this.renderer.getPageCount?.(),
        fileSize: this.currentData.byteLength,
      };

      this.emit('load', this.currentMeta);
      this.options.onDocumentLoad?.(this.currentMeta);

      if (this.options.initialSearchTerms?.length) {
        const results = this.searchEngine.searchMultiple(this.options.initialSearchTerms);
        this.emit('search', { query: this.options.initialSearchTerms.join(', '), results });
        this.options.onSearchChange?.(this.options.initialSearchTerms.join(', '), results);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.showError(error.message);
      this.emit('error', error);
      this.options.onError?.(error);
    }
  }

  async loadDocument(index: number): Promise<void> {
    const docs = this.options.documents;
    if (!docs || index < 0 || index >= docs.length) return;

    this.activeDocIndex = index;
    const doc = docs[index];
    this.options.onDocumentChange?.(index, doc);
    this.emit('documentChange', { index, document: doc });

    await this.load(doc);
  }

  search(query: string): SearchResult[] {
    const results = this.searchEngine.search(query);
    this.emit('search', { query, results });
    this.options.onSearchChange?.(query, results);
    return results;
  }

  /**
   * Wire up the renderer's onOCRReady callback so we get notified when
   * background OCR finishes and can re-search with the augmented data.
   */
  private setupOCRCallback(): void {
    if (!this.options.enableOCR || !this.renderer) return;

    const renderer = this.renderer as any;
    if (typeof renderer.hasScannedPages !== 'function' || !renderer.hasScannedPages()) return;

    this.emit('ocrProgress', { processing: true });
    this.options.onOCRProgress?.(true);

    renderer.onOCRReady = () => {
      this.emit('ocrProgress', { processing: false });
      this.options.onOCRProgress?.(false);

      // If the user has an active search, re-run it to include OCR results
      const currentQuery = this.searchEngine.getQuery();
      if (currentQuery) {
        const results = this.searchEngine.search(currentQuery);
        this.emit('search', { query: currentQuery, results });
        this.options.onSearchChange?.(currentQuery, results);
      }
    };
  }

  nextMatch(): number {
    return this.searchEngine.nextMatch();
  }

  prevMatch(): number {
    return this.searchEngine.prevMatch();
  }

  clearSearch(): void {
    this.searchEngine.clear();
  }

  getSearchResults(): SearchResult[] {
    return this.searchEngine.getResults();
  }

  getActiveSearchIndex(): number {
    return this.searchEngine.getActiveIndex();
  }

  getSearchCount(): number {
    return this.searchEngine.getCount();
  }

  setZoom(level: number): void {
    this.zoomManager.setZoom(level);
    this.renderer?.setZoom?.(level);
  }

  getZoom(): number {
    return this.zoomManager.getZoom();
  }

  zoomIn(): void {
    this.zoomManager.zoomIn();
  }

  zoomOut(): void {
    this.zoomManager.zoomOut();
  }

  resetZoom(): void {
    this.zoomManager.resetZoom();
  }

  fitToWidth(): void {
    this.zoomManager.fitToWidth();
  }

  getPageCount(): number {
    return this.renderer?.getPageCount?.() ?? 1;
  }

  getCurrentPage(): number {
    return this.renderer?.getCurrentPage?.() ?? 1;
  }

  goToPage(page: number): void {
    this.renderer?.goToPage?.(page);
    this.emit('pageChange', { page });
  }

  rotate(degrees = 90): void {
    this.renderer?.rotate?.(degrees);
  }

  getMeta(): DocumentMeta | null {
    return this.currentMeta;
  }

  getFileType(): FileType | null {
    return this.currentFileType;
  }

  getRenderer(): IRenderer | null {
    return this.renderer;
  }

  getActiveDocumentIndex(): number {
    return this.activeDocIndex;
  }

  getDocuments(): DocumentSource[] {
    if (this.options.documents) return this.options.documents;
    if (this.options.document) return [this.options.document];
    return [];
  }

  getCurrentData(): ArrayBuffer | null {
    return this.currentData;
  }

  on<K extends DocViewerEvent>(event: K, callback: EventCallback<DocViewerEventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<K extends DocViewerEvent>(event: K, callback: EventCallback<DocViewerEventMap[K]>): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<K extends DocViewerEvent>(event: K, data: DocViewerEventMap[K]): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  destroy(): void {
    this.isDestroyed = true;
    this.renderer?.destroy();
    this.renderer = null;
    this.zoomManager.detach();
    this.searchEngine.clear();
    this.listeners.clear();

    if (this.engineMode.mode === 'managed') {
      clearElement(this.container);
    } else {
      clearElement(this.contentEl);
    }
    this.currentData = null;
  }

  static registerRenderer = registerRenderer;

  private getActiveDocument(): DocumentSource | undefined {
    if (this.options.documents?.length) {
      return this.options.documents[this.activeDocIndex];
    }
    return this.options.document;
  }

  private applyTheme(): void {
    if (!this.rootEl) return;
    const theme = this.options.theme;
    if (!theme) return;

    if (typeof theme === 'string') {
      this.rootEl.dataset.dvTheme = theme;
    } else {
      if (theme.preset) {
        this.rootEl.dataset.dvTheme = theme.preset;
      }
      if (theme.variables) {
        for (const [key, value] of Object.entries(theme.variables)) {
          this.rootEl.style.setProperty(key, value);
        }
      }
    }
  }

  private applyProtection(): void {
    if (!this.rootEl) return;
    if (this.options.disableSelection) {
      this.rootEl.classList.add('dv-no-select');
    }
    if (this.options.disablePrint) {
      this.rootEl.classList.add('dv-no-print');
    }
  }

  private showLoading(): void {
    clearElement(this.contentEl);
    const loader = createElement('div', 'dv-loading', this.contentEl);
    createElement('div', 'dv-spinner', loader);
    const label = createElement('span', undefined, loader);
    label.textContent = 'Loading document...';
  }

  private showError(message: string): void {
    clearElement(this.contentEl);
    const errorEl = createElement('div', 'dv-error', this.contentEl);
    const icon = createElement('div', 'dv-error-icon', errorEl);
    icon.textContent = '⚠';
    const msg = createElement('div', 'dv-error-message', errorEl);
    msg.textContent = message;
  }
}

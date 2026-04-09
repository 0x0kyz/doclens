import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, SearchResult, SearchOptions, OutlineItem } from '../types';
import type { OCRWord } from '../ocr/OCREngine';

const HIGHLIGHT_CLASS = 'dv-highlight';
const ACTIVE_CLASS = 'dv-highlight--active';

export class PDFRenderer extends BaseRenderer {
  private pdfDoc: any = null;
  private pdfnovaModule: any = null;
  private pages: HTMLElement[] = [];
  private pageObjects: any[] = [];
  private currentPage = 1;
  private totalPages = 0;
  private scale = 1.5;
  private rotation = 0;
  private password: string | undefined;
  private textContents: string[] = [];
  private wrapper: HTMLElement | null = null;

  private highlightResults: SearchResult[] = [];
  private highlightActiveIndex = -1;

  private ocrEnabled = false;
  /** All page indices eligible for OCR (all pages when enableOCR, else only empty-text pages) */
  private ocrPageCandidates: number[] = [];
  /** OCR words keyed by page index (populated lazily on first search) */
  private ocrPageWords = new Map<number, OCRWord[]>();
  private ocrProcessed = false;
  private ocrProcessingPromise: Promise<void> | null = null;

  /** Set by the engine after render(); called when background OCR finishes. */
  onOCRReady?: () => void;

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    this.ocrEnabled = ctx.enableOCR;
    this.pdfnovaModule = await this.loadPdfNova();
    const { PDFDocument } = this.pdfnovaModule;

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dv-pdf-wrapper';
    ctx.container.appendChild(this.wrapper);

    try {
      const openOptions: Record<string, unknown> = {};
      if (this.password) openOptions.password = this.password;

      this.pdfDoc = await PDFDocument.open(new Uint8Array(ctx.data), openOptions);
      this.totalPages = this.pdfDoc.pageCount;

      await this.renderAllPages();

      // Start OCR eagerly so data is ready before the user searches
      if (this.ocrEnabled && this.ocrPageCandidates.length > 0) {
        this.ocrProcessingPromise = this.runOCROnPages().then(() => {
          this.onOCRReady?.();
        });
      }

      this.contentEl = this.wrapper;
    } catch (err: any) {
      if (err?.message?.includes('password') || err?.message?.includes('Password')) {
        this.renderPasswordPrompt(ctx);
        return;
      }
      throw err;
    }
  }

  // --- Search using PDFium rects for pixel-accurate highlighting ---

  search(query: string, options?: SearchOptions): SearchResult[] {
    this.clearHighlights();

    if (!this.pdfDoc || !this.wrapper || !query) {
      this.highlightResults = [];
      return [];
    }

    const pdfnovaOpts: Record<string, boolean> = {};
    if (options?.caseSensitive) pdfnovaOpts.caseSensitive = true;
    if (options?.wholeWord) pdfnovaOpts.wholeWord = true;

    const termIndex = options?.termIndex ?? 0;
    let pdfResults: any[];

    try {
      pdfResults = this.pdfDoc.search(query, pdfnovaOpts);
    } catch {
      pdfResults = [];
    }

    const results: SearchResult[] = [];
    const matchCounter = { value: 0 };

    // Track pdfnova highlight rects per page so OCR can skip overlapping regions
    const pdfnovaMatchedPages = new Map<number, Array<{ left: number; top: number; width: number; height: number }>>();

    for (const pdfResult of pdfResults) {
      const pageIdx: number = pdfResult.pageIndex;
      const rects: Array<{ left: number; top: number; right: number; bottom: number }> =
        pdfResult.rects;

      if (!rects || rects.length === 0) continue;

      const pageDiv = this.pages[pageIdx];
      if (!pageDiv) continue;

      const page = this.pageObjects[pageIdx];
      const pageHeight = page?.height ?? 0;

      const matchIndex = matchCounter.value++;
      const overlays = this.createRectsOverlays(rects, pageHeight, pageDiv, termIndex, matchIndex);

      if (overlays.length > 0) {
        results.push({
          index: results.length,
          node: overlays[0],
          text: pdfResult.text ?? query,
          page: pageIdx + 1,
          termIndex,
        });

        // Record the DOM positions of pdfnova highlights for dedup
        if (!pdfnovaMatchedPages.has(pageIdx)) {
          pdfnovaMatchedPages.set(pageIdx, []);
        }
        const pageRects = pdfnovaMatchedPages.get(pageIdx)!;
        for (const rect of rects) {
          pageRects.push({
            left: rect.left * this.scale,
            top: (pageHeight - rect.top) * this.scale,
            width: (rect.right - rect.left) * this.scale,
            height: (rect.top - rect.bottom) * this.scale,
          });
        }
      }
    }

    // Search OCR-processed pages for text in images that pdfnova can't see
    if (this.ocrEnabled && this.ocrProcessed && this.ocrPageCandidates.length > 0) {
      this.searchOCRPages(query, termIndex, matchCounter, results, pdfnovaMatchedPages);
    }

    // Sort by document order: page first, then vertical position within page
    results.sort((a, b) => {
      const pageDiff = (a.page ?? 0) - (b.page ?? 0);
      if (pageDiff !== 0) return pageDiff;
      return parseFloat(a.node.style.top) - parseFloat(b.node.style.top);
    });
    results.forEach((r, i) => { r.index = i; });

    this.highlightResults = results;
    return results;
  }

  /**
   * Async search that triggers OCR on scanned pages first, then runs search.
   * Called by the engine when a regular search returns few results and scanned pages exist.
   */
  async searchWithOCR(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    await this.ensureOCRReady();
    return this.search(query, options);
  }

  async ensureOCRReady(): Promise<void> {
    if (!this.ocrEnabled || this.ocrProcessed || this.ocrPageCandidates.length === 0) return;
    if (!this.ocrProcessingPromise) {
      this.ocrProcessingPromise = this.runOCROnPages();
    }
    await this.ocrProcessingPromise;
  }

  hasScannedPages(): boolean {
    return this.ocrEnabled && this.ocrPageCandidates.length > 0;
  }

  highlightMatch(index: number): void {
    if (!this.wrapper) return;

    // Remove active from all overlays of the previous match (use stored node's matchIndex, not sorted index)
    if (this.highlightActiveIndex >= 0 && this.highlightActiveIndex < this.highlightResults.length) {
      const prevMatchId = this.highlightResults[this.highlightActiveIndex].node.dataset.matchIndex;
      if (prevMatchId) {
        this.wrapper
          .querySelectorAll(`.${HIGHLIGHT_CLASS}[data-match-index="${prevMatchId}"]`)
          .forEach((el) => el.classList.remove(ACTIVE_CLASS));
      }
    }

    this.highlightActiveIndex = index;

    if (index >= 0 && index < this.highlightResults.length) {
      const matchId = this.highlightResults[index].node.dataset.matchIndex;
      if (matchId) {
        this.wrapper
          .querySelectorAll(`.${HIGHLIGHT_CLASS}[data-match-index="${matchId}"]`)
          .forEach((el) => el.classList.add(ACTIVE_CLASS));
      }

      this.highlightResults[index].node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }

  clearHighlights(): void {
    if (!this.wrapper) return;
    this.wrapper.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.remove());
    this.highlightResults = [];
    this.highlightActiveIndex = -1;
  }

  getSearchResults(): SearchResult[] {
    return this.highlightResults;
  }

  private createRectsOverlays(
    rects: Array<{ left: number; top: number; right: number; bottom: number }>,
    pageHeight: number,
    pageDiv: HTMLElement,
    termIndex: number,
    matchIndex: number,
  ): HTMLElement[] {
    const overlays: HTMLElement[] = [];

    for (const rect of rects) {
      const domLeft = rect.left * this.scale;
      const domTop = (pageHeight - rect.top) * this.scale;
      const domWidth = (rect.right - rect.left) * this.scale;
      const domHeight = (rect.top - rect.bottom) * this.scale;

      const overlay = document.createElement('div');
      overlay.className = HIGHLIGHT_CLASS;
      overlay.dataset.termIndex = String(termIndex);
      overlay.dataset.matchIndex = String(matchIndex);
      overlay.style.position = 'absolute';
      overlay.style.left = `${domLeft}px`;
      overlay.style.top = `${domTop}px`;
      overlay.style.width = `${domWidth}px`;
      overlay.style.height = `${domHeight}px`;
      overlay.style.pointerEvents = 'none';
      pageDiv.appendChild(overlay);
      overlays.push(overlay);
    }

    return overlays;
  }

  // --- OCR for pages with images ---

  private async runOCROnPages(): Promise<void> {
    try {
      const { recognizeImage, isOCRAvailable } = await import('../ocr/OCREngine');
      if (!(await isOCRAvailable())) {
        this.ocrProcessed = true;
        return;
      }

      for (const pageIdx of this.ocrPageCandidates) {
        const pageDiv = this.pages[pageIdx];
        if (!pageDiv) continue;

        const canvas = pageDiv.querySelector('canvas');
        if (!canvas) continue;

        try {
          const result = await recognizeImage(canvas);
          this.ocrPageWords.set(pageIdx, result.words);
          if (!this.textContents[pageIdx]?.trim()) {
            this.textContents[pageIdx] = result.text;
          }
        } catch {
          // Silently skip failed pages
        }
      }
    } catch {
      // tesseract.js not available
    }
    this.ocrProcessed = true;
  }

  private searchOCRPages(
    query: string,
    termIndex: number,
    matchCounter: { value: number },
    results: SearchResult[],
    pdfnovaRects: Map<number, Array<{ left: number; top: number; width: number; height: number }>>,
  ): void {
    const lowerQuery = query.toLowerCase();

    for (const pageIdx of this.ocrPageCandidates) {
      const words = this.ocrPageWords.get(pageIdx);
      if (!words || words.length === 0) continue;

      const pageDiv = this.pages[pageIdx];
      if (!pageDiv) continue;

      const canvas = pageDiv.querySelector('canvas');
      if (!canvas) continue;

      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const divW = pageDiv.clientWidth || canvasW;
      const divH = pageDiv.clientHeight || canvasH;
      const scaleX = divW / canvasW;
      const scaleY = divH / canvasH;

      const existingRects = pdfnovaRects.get(pageIdx) ?? [];

      const ranges = this.findOCRWordRanges(words, lowerQuery);

      for (const range of ranges) {
        const firstWord = range[0];
        const ocrLeft = firstWord.bbox.x0 * scaleX;
        const ocrTop = firstWord.bbox.y0 * scaleY;
        const ocrRight = range[range.length - 1].bbox.x1 * scaleX;
        const ocrBottom = range[range.length - 1].bbox.y1 * scaleY;

        if (this.overlapsExisting(ocrLeft, ocrTop, ocrRight, ocrBottom, existingRects)) {
          continue;
        }

        const matchIndex = matchCounter.value++;
        const overlays: HTMLElement[] = [];

        for (const word of range) {
          const overlay = document.createElement('div');
          overlay.className = HIGHLIGHT_CLASS;
          overlay.dataset.termIndex = String(termIndex);
          overlay.dataset.matchIndex = String(matchIndex);
          overlay.style.position = 'absolute';
          overlay.style.left = `${word.bbox.x0 * scaleX}px`;
          overlay.style.top = `${word.bbox.y0 * scaleY}px`;
          overlay.style.width = `${(word.bbox.x1 - word.bbox.x0) * scaleX}px`;
          overlay.style.height = `${(word.bbox.y1 - word.bbox.y0) * scaleY}px`;
          overlay.style.pointerEvents = 'none';
          pageDiv.appendChild(overlay);
          overlays.push(overlay);
        }

        if (overlays.length > 0) {
          results.push({
            index: results.length,
            node: overlays[0],
            text: range.map((w) => w.text).join(' '),
            page: pageIdx + 1,
            termIndex,
          });
        }
      }
    }
  }

  /** Check if an OCR rect overlaps significantly with any existing pdfnova highlight. */
  private overlapsExisting(
    ocrL: number, ocrT: number, ocrR: number, ocrB: number,
    existing: Array<{ left: number; top: number; width: number; height: number }>,
  ): boolean {
    for (const r of existing) {
      const rL = r.left;
      const rT = r.top;
      const rR = r.left + r.width;
      const rB = r.top + r.height;

      const overlapL = Math.max(ocrL, rL);
      const overlapT = Math.max(ocrT, rT);
      const overlapR = Math.min(ocrR, rR);
      const overlapB = Math.min(ocrB, rB);

      if (overlapR > overlapL && overlapB > overlapT) {
        const overlapArea = (overlapR - overlapL) * (overlapB - overlapT);
        const ocrArea = (ocrR - ocrL) * (ocrB - ocrT);
        // If >30% of the OCR rect is covered, consider it a duplicate
        if (ocrArea > 0 && overlapArea / ocrArea > 0.3) {
          return true;
        }
      }
    }
    return false;
  }

  private findOCRWordRanges(words: OCRWord[], lowerQuery: string): OCRWord[][] {
    const ranges: OCRWord[][] = [];

    for (const word of words) {
      if (word.text.toLowerCase().includes(lowerQuery)) {
        ranges.push([word]);
      }
    }

    if (ranges.length > 0) return ranges;

    const queryTokens = lowerQuery.split(/\s+/);
    if (queryTokens.length <= 1) return ranges;

    for (let i = 0; i <= words.length - queryTokens.length; i++) {
      const slice = words.slice(i, i + queryTokens.length);
      const joined = slice.map((w) => w.text.toLowerCase()).join(' ');
      if (joined.includes(lowerQuery)) {
        ranges.push(slice);
      }
    }

    return ranges;
  }

  // --- pdfnova loading ---

  private async loadPdfNova(): Promise<any> {
    try {
      return await import('pdfnova/lite');
    } catch {
      // Fall back to full tier if lite isn't available
    }
    try {
      return await import('pdfnova');
    } catch {
      // Not installed
    }
    throw new Error(
      'pdfnova is required for PDF rendering. Install it with: npm install pdfnova',
    );
  }

  // --- Page rendering ---

  private async renderAllPages(): Promise<void> {
    if (!this.pdfDoc || !this.wrapper) return;

    this.wrapper.innerHTML = '';
    this.pages = [];
    this.pageObjects = [];
    this.textContents = [];

    for (let i = 0; i < this.totalPages; i++) {
      const page = this.pdfDoc.getPage(i);
      this.pageObjects.push(page);

      const canvasWidth = Math.floor(page.width * this.scale);
      const canvasHeight = Math.floor(page.height * this.scale);

      const pageDiv = document.createElement('div');
      pageDiv.className = 'dv-pdf-page';
      pageDiv.dataset.pageNumber = String(i + 1);
      pageDiv.style.width = `${canvasWidth}px`;
      pageDiv.style.height = `${canvasHeight}px`;

      const canvas = document.createElement('canvas');
      await page.render(canvas, {
        scale: this.scale,
        rotation: this.rotation as 0 | 90 | 180 | 270,
      });
      pageDiv.appendChild(canvas);

      // Build text layer at render scale using pdfnova
      const textLayerContainer = document.createElement('div');
      textLayerContainer.className = 'dv-pdf-text-layer-wrap';
      textLayerContainer.style.cssText =
        'position: absolute; inset: 0; overflow: hidden;';

      try {
        const textLayerEl = page.createTextLayer(textLayerContainer);
        // Override pdfnova's defaults for our use case
        textLayerEl.style.opacity = '1';
        textLayerEl.classList.add('dv-pdf-text-layer');

        // Scale text layer from PDF-point coords to canvas coords
        textLayerEl.style.transform = `scale(${this.scale})`;
        textLayerEl.style.transformOrigin = '0 0';
      } catch {
        // Text layer not critical — rendering still works
      }

      pageDiv.appendChild(textLayerContainer);

      // Text content for getTextContent()
      try {
        const text = page.getText();
        this.textContents.push(text);
        if (this.ocrEnabled) {
          // OCR all pages to catch text inside images
          this.ocrPageCandidates.push(i);
        } else if (!text || text.trim().length === 0) {
          this.ocrPageCandidates.push(i);
        }
      } catch {
        this.textContents.push('');
        this.ocrPageCandidates.push(i);
      }

      this.wrapper.appendChild(pageDiv);
      this.pages.push(pageDiv);
    }
  }

  // --- Password ---

  private renderPasswordPrompt(ctx: RendererContext): void {
    const dialog = document.createElement('div');
    dialog.className = 'dv-password-dialog';
    dialog.innerHTML = `
      <div class="dv-error-icon">🔒</div>
      <p>This PDF is password-protected.</p>
      <input type="password" placeholder="Enter password" class="dv-password-input" />
      <button class="dv-password-submit">Open</button>
      <p class="dv-error-message" style="display:none"></p>
    `;

    const input = dialog.querySelector<HTMLInputElement>('.dv-password-input')!;
    const btn = dialog.querySelector<HTMLButtonElement>('.dv-password-submit')!;
    const errMsg = dialog.querySelector<HTMLElement>('.dv-error-message')!;

    const submit = async () => {
      this.password = input.value;
      try {
        ctx.container.innerHTML = '';
        await this.render(ctx);
      } catch {
        errMsg.textContent = 'Incorrect password. Please try again.';
        errMsg.style.display = 'block';
        ctx.container.innerHTML = '';
        ctx.container.appendChild(dialog);
      }
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });

    ctx.container.appendChild(dialog);
    input.focus();
  }

  async setPassword(password: string): Promise<boolean> {
    this.password = password;
    if (this.ctx) {
      try {
        await this.render(this.ctx);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // --- Navigation ---

  getPageCount(): number {
    return this.totalPages;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    const pageEl = this.pages[page - 1];
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  rotate(degrees: number): void {
    this.rotation = (this.rotation + degrees) % 360;
    if (this.ctx) {
      this.render(this.ctx);
    }
  }

  getOutline(): OutlineItem[] {
    if (!this.pdfDoc) return [];
    try {
      const outline = this.pdfDoc.outline;
      return this.mapOutline(outline);
    } catch {
      return [];
    }
  }

  private mapOutline(items: any[]): OutlineItem[] {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => ({
      title: item.title ?? '',
      pageIndex: item.pageIndex ?? 0,
      children: this.mapOutline(item.children),
    }));
  }

  getTextContent(): string {
    return this.textContents.join('\n\n');
  }

  destroy(): void {
    if (this.pdfDoc) {
      try {
        for (const page of this.pageObjects) {
          page.close?.();
        }
        this.pdfDoc.close();
      } catch {
        // Ignore close errors
      }
      this.pdfDoc = null;
    }
    this.pdfnovaModule = null;
    this.pages = [];
    this.pageObjects = [];
    this.textContents = [];
    this.highlightResults = [];
    this.ocrEnabled = false;
    this.ocrPageCandidates = [];
    this.ocrPageWords.clear();
    this.ocrProcessed = false;
    this.ocrProcessingPromise = null;
    this.onOCRReady = undefined;
    super.destroy();
  }
}

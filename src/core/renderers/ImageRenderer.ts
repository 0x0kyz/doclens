import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, SearchResult, SearchOptions } from '../types';
import type { OCRWord } from '../ocr/OCREngine';

const HIGHLIGHT_CLASS = 'dv-highlight';
const ACTIVE_CLASS = 'dv-highlight--active';

export class ImageRenderer extends BaseRenderer {
  private imgEl: HTMLImageElement | null = null;
  private wrapper: HTMLElement | null = null;
  private rotation = 0;
  private objectUrl: string | null = null;

  private ocrEnabled = false;
  private ocrWords: OCRWord[] = [];
  private ocrText = '';
  private ocrReady = false;
  private ocrRunning = false;

  private highlightResults: SearchResult[] = [];
  private highlightActiveIndex = -1;

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dv-image-viewer';
    this.wrapper.style.position = 'relative';

    this.imgEl = document.createElement('img');
    this.imgEl.alt = ctx.source.fileName ?? 'Image';

    const blob = new Blob([ctx.data]);
    this.objectUrl = URL.createObjectURL(blob);
    this.imgEl.src = this.objectUrl;

    this.wrapper.appendChild(this.imgEl);
    ctx.container.appendChild(this.wrapper);
    this.contentEl = this.wrapper;

    this.ocrEnabled = ctx.enableOCR;
    if (this.ocrEnabled) {
      this.runOCR(blob);
    }
  }

  private async runOCR(blob: Blob): Promise<void> {
    if (this.ocrRunning) return;
    this.ocrRunning = true;

    try {
      const { recognizeImage, isOCRAvailable } = await import('../ocr/OCREngine');
      if (!(await isOCRAvailable())) return;

      const result = await recognizeImage(blob);
      this.ocrText = result.text;
      this.ocrWords = result.words;
      this.ocrReady = true;
    } catch {
      // OCR not available or failed — images just won't be searchable
    } finally {
      this.ocrRunning = false;
    }
  }

  setZoom(level: number): void {
    if (!this.imgEl) return;
    this.imgEl.style.transform = `scale(${level}) rotate(${this.rotation}deg)`;
  }

  rotate(degrees: number): void {
    this.rotation = (this.rotation + degrees) % 360;
    if (this.imgEl) {
      this.imgEl.style.transform = `rotate(${this.rotation}deg)`;
    }
  }

  search(query: string, _options?: SearchOptions): SearchResult[] {
    this.clearHighlights();

    if (!this.ocrReady || !this.wrapper || !this.imgEl || !query) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    const imgNatW = this.imgEl.naturalWidth;
    const imgNatH = this.imgEl.naturalHeight;
    const imgDispW = this.imgEl.clientWidth;
    const imgDispH = this.imgEl.clientHeight;

    if (!imgNatW || !imgNatH || !imgDispW || !imgDispH) return [];

    const scaleX = imgDispW / imgNatW;
    const scaleY = imgDispH / imgNatH;

    // Search through OCR words and highlight matching sequences
    const matchRanges = this.findWordMatchRanges(lowerQuery);

    for (const range of matchRanges) {
      const overlays: HTMLElement[] = [];

      for (const word of range) {
        const overlay = document.createElement('div');
        overlay.className = HIGHLIGHT_CLASS;
        overlay.dataset.matchIndex = String(results.length);
        overlay.style.position = 'absolute';
        overlay.style.left = `${word.bbox.x0 * scaleX}px`;
        overlay.style.top = `${word.bbox.y0 * scaleY}px`;
        overlay.style.width = `${(word.bbox.x1 - word.bbox.x0) * scaleX}px`;
        overlay.style.height = `${(word.bbox.y1 - word.bbox.y0) * scaleY}px`;
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '1';
        this.wrapper!.appendChild(overlay);
        overlays.push(overlay);
      }

      if (overlays.length > 0) {
        results.push({
          index: results.length,
          node: overlays[0],
          text: range.map((w) => w.text).join(' '),
        });
      }
    }

    this.highlightResults = results;
    return results;
  }

  /**
   * Find contiguous word ranges that together contain the query string.
   * Handles both single-word matches and multi-word phrase matches.
   */
  private findWordMatchRanges(lowerQuery: string): OCRWord[][] {
    const ranges: OCRWord[][] = [];

    // Single-word matching
    for (const word of this.ocrWords) {
      if (word.text.toLowerCase().includes(lowerQuery)) {
        ranges.push([word]);
      }
    }

    if (ranges.length > 0) return ranges;

    // Multi-word phrase matching: slide a window over adjacent words
    const queryTokens = lowerQuery.split(/\s+/);
    if (queryTokens.length <= 1) return ranges;

    for (let i = 0; i <= this.ocrWords.length - queryTokens.length; i++) {
      const slice = this.ocrWords.slice(i, i + queryTokens.length);
      const joined = slice.map((w) => w.text.toLowerCase()).join(' ');
      if (joined.includes(lowerQuery)) {
        ranges.push(slice);
      }
    }

    return ranges;
  }

  highlightMatch(index: number): void {
    if (!this.wrapper) return;

    if (this.highlightActiveIndex >= 0) {
      this.wrapper
        .querySelectorAll(`.${HIGHLIGHT_CLASS}[data-match-index="${this.highlightActiveIndex}"]`)
        .forEach((el) => el.classList.remove(ACTIVE_CLASS));
    }

    this.highlightActiveIndex = index;

    if (index >= 0 && index < this.highlightResults.length) {
      this.wrapper
        .querySelectorAll(`.${HIGHLIGHT_CLASS}[data-match-index="${index}"]`)
        .forEach((el) => el.classList.add(ACTIVE_CLASS));

      this.highlightResults[index].node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }

  clearHighlights(): void {
    if (this.wrapper) {
      this.wrapper.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.remove());
    }
    this.highlightResults = [];
    this.highlightActiveIndex = -1;
  }

  getSearchResults(): SearchResult[] {
    return this.highlightResults;
  }

  getTextContent(): string {
    return this.ocrText;
  }

  destroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.imgEl = null;
    this.wrapper = null;
    this.ocrEnabled = false;
    this.ocrWords = [];
    this.ocrText = '';
    this.ocrReady = false;
    this.highlightResults = [];
    super.destroy();
  }
}

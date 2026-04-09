import type {
  IRenderer,
  RendererContext,
  SearchResult,
  SearchOptions,
  OutlineItem,
} from '../types';
import { Highlighter } from '../search/highlighter';

export abstract class BaseRenderer implements IRenderer {
  protected ctx: RendererContext | null = null;
  protected highlighter = new Highlighter();
  protected contentEl: HTMLElement | null = null;

  async render(ctx: RendererContext): Promise<void> {
    this.ctx = ctx;
    this.contentEl = ctx.container;
    this.highlighter.setContainer(ctx.container);
  }

  destroy(): void {
    this.highlighter.clearHighlights();
    if (this.contentEl) {
      this.contentEl.innerHTML = '';
    }
    this.ctx = null;
    this.contentEl = null;
  }

  getContainer(): HTMLElement | null {
    return this.contentEl;
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    return this.highlighter.search(query, options);
  }

  highlightMatch(index: number): void {
    this.highlighter.highlightMatch(index);
  }

  clearHighlights(): void {
    this.highlighter.clearHighlights();
  }

  getSearchResults(): SearchResult[] {
    return this.highlighter.getResults();
  }

  setZoom?(_level: number): void {}
  getPageCount?(): number { return 1; }
  getCurrentPage?(): number { return 1; }
  goToPage?(_page: number): void {}
  getOutline?(): OutlineItem[] { return []; }

  async setPassword?(_password: string): Promise<boolean> { return false; }
  rotate?(_degrees: number): void {}
  getTextContent?(): string { return ''; }
}

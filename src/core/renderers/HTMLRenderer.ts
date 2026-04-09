import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, SearchResult, SearchOptions } from '../types';

export class HTMLRenderer extends BaseRenderer {
  private shadowRoot: ShadowRoot | null = null;
  private shadowContent: HTMLElement | null = null;

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const html = new TextDecoder('utf-8').decode(ctx.data);

    const host = document.createElement('div');
    host.className = 'dv-html-viewer';

    this.shadowRoot = host.attachShadow({ mode: 'open' });

    this.shadowContent = document.createElement('div');
    this.shadowContent.className = 'dv-html-content';
    this.shadowContent.innerHTML = this.sanitizeHtml(html);
    this.shadowRoot.appendChild(this.shadowContent);

    ctx.container.appendChild(host);
    this.contentEl = host;
    this.highlighter.setContainer(this.shadowContent);
  }

  private sanitizeHtml(html: string): string {
    // Remove script tags for security
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '');
  }

  search(query: string, options?: SearchOptions): SearchResult[] {
    if (!this.shadowContent) return [];
    this.highlighter.setContainer(this.shadowContent);
    return this.highlighter.search(query, options);
  }

  getTextContent(): string {
    return this.shadowContent?.textContent ?? '';
  }
}

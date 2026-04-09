import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, OutlineItem } from '../types';

export class MarkdownRenderer extends BaseRenderer {
  private headings: OutlineItem[] = [];

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const text = new TextDecoder('utf-8').decode(ctx.data);
    let html: string;

    try {
      let markedModule: any;
      try {
        const mod = 'marked';
        markedModule = await import(/* @vite-ignore */ mod);
      } catch {
        const cdn = 'https://esm.sh/marked@15.0.0';
        markedModule = await import(/* @vite-ignore */ cdn);
      }
      const marked = markedModule.marked ?? markedModule.default?.marked ?? markedModule.default;
      html = await marked(text, {
        gfm: true,
        breaks: false,
      });
    } catch {
      html = this.fallbackRender(text);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'dv-markdown-viewer';
    wrapper.innerHTML = html;

    this.extractHeadings(wrapper);

    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
    this.highlighter.setContainer(wrapper);
  }

  private fallbackRender(text: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre>${escaped}</pre>`;
  }

  private extractHeadings(el: HTMLElement): void {
    this.headings = [];
    const headingEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headingEls.forEach((heading, idx) => {
      const id = `dv-md-heading-${idx}`;
      heading.id = id;

      this.headings.push({
        title: heading.textContent ?? '',
        dest: id,
      });
    });
  }

  getOutline(): OutlineItem[] {
    return this.headings;
  }

  getTextContent(): string {
    return this.contentEl?.textContent ?? '';
  }
}

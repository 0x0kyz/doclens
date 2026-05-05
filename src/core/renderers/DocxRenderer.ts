import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, OutlineItem } from '../types';

export class DocxRenderer extends BaseRenderer {
  private headings: OutlineItem[] = [];

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const mammoth = await import('mammoth').then(m => m.default ?? m);

    const result = await mammoth.convertToHtml(
      { arrayBuffer: ctx.data },
      {
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
        ],
      },
    );

    const wrapper = document.createElement('div');
    wrapper.className = 'dv-docx-viewer';
    wrapper.innerHTML = result.value;

    this.extractHeadings(wrapper);

    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
    this.highlighter.setContainer(wrapper);
  }

  private extractHeadings(el: HTMLElement): void {
    this.headings = [];
    const headingEls = el.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headingEls.forEach((heading, idx) => {
      const id = `dv-heading-${idx}`;
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

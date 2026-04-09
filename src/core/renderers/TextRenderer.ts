import { BaseRenderer } from './BaseRenderer';
import type { RendererContext } from '../types';

export class TextRenderer extends BaseRenderer {
  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const text = new TextDecoder('utf-8').decode(ctx.data);

    const pre = document.createElement('pre');
    pre.className = 'dv-text-viewer';
    pre.textContent = text;

    ctx.container.appendChild(pre);
    this.contentEl = pre;
    this.highlighter.setContainer(pre);
  }

  getTextContent(): string {
    return this.contentEl?.textContent ?? '';
  }
}

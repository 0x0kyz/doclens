import { BaseRenderer } from './BaseRenderer';
import type { RendererContext } from '../types';
import { escapeHtml } from '../utils/dom';

export class JSONRenderer extends BaseRenderer {
  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const text = new TextDecoder('utf-8').decode(ctx.data);
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      const pre = document.createElement('pre');
      pre.className = 'dv-text-viewer';
      pre.textContent = text;
      ctx.container.appendChild(pre);
      this.contentEl = pre;
      this.highlighter.setContainer(pre);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'dv-json-tree';
    wrapper.innerHTML = this.renderValue(parsed, 0);
    this.attachToggleListeners(wrapper);

    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
    this.highlighter.setContainer(wrapper);
  }

  private renderValue(value: unknown, depth: number): string {
    if (value === null) return `<span class="dv-json-null">null</span>`;
    if (typeof value === 'boolean')
      return `<span class="dv-json-boolean">${value}</span>`;
    if (typeof value === 'number')
      return `<span class="dv-json-number">${value}</span>`;
    if (typeof value === 'string')
      return `<span class="dv-json-string">"${escapeHtml(value)}"</span>`;

    if (Array.isArray(value)) return this.renderArray(value, depth);
    if (typeof value === 'object') return this.renderObject(value as Record<string, unknown>, depth);

    return `<span>${escapeHtml(String(value))}</span>`;
  }

  private renderObject(obj: Record<string, unknown>, depth: number): string {
    const entries = Object.entries(obj);
    if (entries.length === 0) {
      return `<span class="dv-json-bracket">{}</span>`;
    }

    const indent = '  '.repeat(depth + 1);
    const closingIndent = '  '.repeat(depth);

    const lines = entries.map(([key, val], i) => {
      const comma = i < entries.length - 1 ? '<span class="dv-json-comma">,</span>' : '';
      return `${indent}<span class="dv-json-key">"${escapeHtml(key)}"</span>: ${this.renderValue(val, depth + 1)}${comma}`;
    });

    const id = `json-${depth}-${Math.random().toString(36).slice(2, 8)}`;

    return [
      `<span class="dv-json-toggle" data-target="${id}">▼</span><span class="dv-json-bracket">{</span>`,
      `<span class="dv-json-ellipsis" data-target="${id}" style="display:none">...</span>`,
      `<span id="${id}">`,
      ...lines,
      `${closingIndent}<span class="dv-json-bracket">}</span></span>`,
    ].join('\n');
  }

  private renderArray(arr: unknown[], depth: number): string {
    if (arr.length === 0) {
      return `<span class="dv-json-bracket">[]</span>`;
    }

    const indent = '  '.repeat(depth + 1);
    const closingIndent = '  '.repeat(depth);

    const lines = arr.map((val, i) => {
      const comma = i < arr.length - 1 ? '<span class="dv-json-comma">,</span>' : '';
      return `${indent}${this.renderValue(val, depth + 1)}${comma}`;
    });

    const id = `json-${depth}-${Math.random().toString(36).slice(2, 8)}`;

    return [
      `<span class="dv-json-toggle" data-target="${id}">▼</span><span class="dv-json-bracket">[</span>`,
      `<span class="dv-json-ellipsis" data-target="${id}" style="display:none">...</span>`,
      `<span id="${id}">`,
      ...lines,
      `${closingIndent}<span class="dv-json-bracket">]</span></span>`,
    ].join('\n');
  }

  private attachToggleListeners(el: HTMLElement): void {
    el.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (
        target.classList.contains('dv-json-toggle') ||
        target.classList.contains('dv-json-ellipsis')
      ) {
        const id = target.dataset.target;
        if (!id) return;

        const content = document.getElementById(id);
        if (!content) return;

        const toggle = el.querySelector<HTMLElement>(`.dv-json-toggle[data-target="${id}"]`);
        const ellipsis = el.querySelector<HTMLElement>(`.dv-json-ellipsis[data-target="${id}"]`);

        const isCollapsed = content.classList.contains('dv-json-collapsed');

        if (isCollapsed) {
          content.classList.remove('dv-json-collapsed');
          if (toggle) toggle.textContent = '▼';
          if (ellipsis) ellipsis.style.display = 'none';
        } else {
          content.classList.add('dv-json-collapsed');
          if (toggle) toggle.textContent = '▶';
          if (ellipsis) ellipsis.style.display = 'inline';
        }
      }
    });
  }

  getTextContent(): string {
    return this.contentEl?.textContent ?? '';
  }
}

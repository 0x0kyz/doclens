import { BaseRenderer } from './BaseRenderer';
import type { RendererContext } from '../types';
import { escapeHtml } from '../utils/dom';

export class XMLRenderer extends BaseRenderer {
  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const text = new TextDecoder('utf-8').decode(ctx.data);
    const wrapper = document.createElement('div');
    wrapper.className = 'dv-xml-viewer';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'application/xml');

      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        wrapper.innerHTML = this.highlightXmlString(text);
      } else {
        wrapper.innerHTML = this.renderNode(doc.documentElement, 0);
      }
    } catch {
      wrapper.innerHTML = this.highlightXmlString(text);
    }

    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
    this.highlighter.setContainer(wrapper);
  }

  private renderNode(node: Element, depth: number): string {
    const indent = '  '.repeat(depth);
    const tagName = node.tagName;
    const attrs = this.renderAttributes(node);

    if (node.childNodes.length === 0) {
      return `${indent}<span class="dv-xml-tag">&lt;${escapeHtml(tagName)}</span>${attrs}<span class="dv-xml-tag"> /&gt;</span>\n`;
    }

    // Check if only text content
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      return `${indent}<span class="dv-xml-tag">&lt;${escapeHtml(tagName)}</span>${attrs}<span class="dv-xml-tag">&gt;</span><span class="dv-xml-text">${escapeHtml(text)}</span><span class="dv-xml-tag">&lt;/${escapeHtml(tagName)}&gt;</span>\n`;
    }

    const lines: string[] = [];
    lines.push(
      `${indent}<span class="dv-xml-tag">&lt;${escapeHtml(tagName)}</span>${attrs}<span class="dv-xml-tag">&gt;</span>\n`,
    );

    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        lines.push(this.renderNode(child as Element, depth + 1));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          lines.push(
            `${'  '.repeat(depth + 1)}<span class="dv-xml-text">${escapeHtml(text)}</span>\n`,
          );
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        lines.push(
          `${'  '.repeat(depth + 1)}<span class="dv-xml-comment">&lt;!-- ${escapeHtml(child.textContent ?? '')} --&gt;</span>\n`,
        );
      }
    }

    lines.push(
      `${indent}<span class="dv-xml-tag">&lt;/${escapeHtml(tagName)}&gt;</span>\n`,
    );

    return lines.join('');
  }

  private renderAttributes(node: Element): string {
    if (!node.attributes.length) return '';

    return Array.from(node.attributes)
      .map(
        (attr) =>
          ` <span class="dv-xml-attr-name">${escapeHtml(attr.name)}</span>=<span class="dv-xml-attr-value">"${escapeHtml(attr.value)}"</span>`,
      )
      .join('');
  }

  private highlightXmlString(xml: string): string {
    return escapeHtml(xml)
      .replace(
        /&lt;(\/?[\w:.-]+)/g,
        '&lt;<span class="dv-xml-tag">$1</span>',
      )
      .replace(
        /([\w:.-]+)=&quot;([^&]*)&quot;/g,
        '<span class="dv-xml-attr-name">$1</span>=<span class="dv-xml-attr-value">"$2"</span>',
      );
  }

  getTextContent(): string {
    return this.contentEl?.textContent ?? '';
  }
}

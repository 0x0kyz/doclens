import { BaseRenderer } from './BaseRenderer';
import type { RendererContext } from '../types';

export class PresentationRenderer extends BaseRenderer {
  private currentSlide = 0;
  private totalSlides = 0;
  private slideContainer: HTMLElement | null = null;
  private slideContent: HTMLElement | null = null;
  private navEl: HTMLElement | null = null;
  private slides: string[] = [];

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    this.slides = await this.extractSlides(ctx.data);
    this.totalSlides = this.slides.length;
    this.currentSlide = 0;

    const wrapper = document.createElement('div');
    wrapper.className = 'dv-slide-container';

    this.slideContent = document.createElement('div');
    this.slideContent.className = 'dv-slide';
    wrapper.appendChild(this.slideContent);

    this.navEl = document.createElement('div');
    this.navEl.className = 'dv-slide-nav';
    wrapper.appendChild(this.navEl);

    this.renderCurrentSlide();
    this.renderNav();

    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
    this.slideContainer = wrapper;
    this.highlighter.setContainer(this.slideContent);
  }

  private async extractSlides(data: ArrayBuffer): Promise<string[]> {
    // Try to use pptx-renderer if available
    try {
      const JSZip = await this.loadJSZip();
      if (!JSZip) throw new Error('JSZip not available');

      const zip = await JSZip.loadAsync(data);
      const slideFiles: string[] = [];

      // Find slide XML files
      for (const path of Object.keys(zip.files)) {
        if (path.match(/ppt\/slides\/slide\d+\.xml$/)) {
          slideFiles.push(path);
        }
      }

      slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0');
        return numA - numB;
      });

      const slides: string[] = [];
      for (const path of slideFiles) {
        const xml = await zip.files[path].async('string');
        const html = this.slideXmlToHtml(xml);
        slides.push(html);
      }

      return slides.length > 0 ? slides : this.fallbackSlides();
    } catch {
      return this.fallbackSlides();
    }
  }

  private async loadJSZip(): Promise<any> {
    try {
      const mod = await import('xlsx');
      // xlsx bundles jszip internally, but we can't access it directly
      // Fall back to a simple ZIP approach
      return null;
    } catch {
      return null;
    }
  }

  private slideXmlToHtml(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');

    const texts: string[] = [];
    const textElements = doc.querySelectorAll('*');

    for (const el of Array.from(textElements)) {
      if (el.localName === 't' || el.localName === 'a:t') {
        const text = el.textContent?.trim();
        if (text) texts.push(text);
      }
    }

    if (texts.length === 0) {
      return '<div style="padding:40px; color:#999; text-align:center;">Empty slide</div>';
    }

    return `<div style="padding:40px; font-family:sans-serif;">${texts.map((t) => `<p style="margin:8px 0; font-size:18px;">${this.escapeHtml(t)}</p>`).join('')}</div>`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private fallbackSlides(): string[] {
    return [
      '<div style="padding:40px; text-align:center; color:#999;"><p>PPTX preview is limited.</p><p>For full fidelity, download and open in PowerPoint.</p></div>',
    ];
  }

  private renderCurrentSlide(): void {
    if (!this.slideContent || !this.slides[this.currentSlide]) return;
    this.slideContent.innerHTML = this.slides[this.currentSlide];
    this.highlighter.setContainer(this.slideContent);
  }

  private renderNav(): void {
    if (!this.navEl) return;

    this.navEl.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'dv-btn';
    prevBtn.innerHTML = '&#9664;';
    prevBtn.disabled = this.currentSlide === 0;
    prevBtn.addEventListener('click', () => this.prevSlide());

    const label = document.createElement('span');
    label.textContent = `${this.currentSlide + 1} / ${this.totalSlides}`;

    const nextBtn = document.createElement('button');
    nextBtn.className = 'dv-btn';
    nextBtn.innerHTML = '&#9654;';
    nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
    nextBtn.addEventListener('click', () => this.nextSlide());

    this.navEl.appendChild(prevBtn);
    this.navEl.appendChild(label);
    this.navEl.appendChild(nextBtn);
  }

  private prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.renderCurrentSlide();
      this.renderNav();
    }
  }

  private nextSlide(): void {
    if (this.currentSlide < this.totalSlides - 1) {
      this.currentSlide++;
      this.renderCurrentSlide();
      this.renderNav();
    }
  }

  getPageCount(): number {
    return this.totalSlides;
  }

  getCurrentPage(): number {
    return this.currentSlide + 1;
  }

  goToPage(page: number): void {
    const idx = page - 1;
    if (idx >= 0 && idx < this.totalSlides) {
      this.currentSlide = idx;
      this.renderCurrentSlide();
      this.renderNav();
    }
  }

  getTextContent(): string {
    const div = document.createElement('div');
    return this.slides.map((s) => {
      div.innerHTML = s;
      return div.textContent ?? '';
    }).join('\n\n');
  }
}

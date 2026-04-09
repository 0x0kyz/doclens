export interface ZoomOptions {
  defaultZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export class ZoomManager {
  private level: number;
  private readonly min: number;
  private readonly max: number;
  private readonly step: number;
  private container: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  private onChange?: (level: number) => void;

  private keyHandler = this.handleKeyboard.bind(this);
  private wheelHandler = this.handleWheel.bind(this);

  constructor(options: ZoomOptions = {}) {
    this.level = options.defaultZoom ?? 1;
    this.min = options.minZoom ?? 0.25;
    this.max = options.maxZoom ?? 5;
    this.step = options.zoomStep ?? 0.25;
  }

  attach(container: HTMLElement, content: HTMLElement, onChange?: (level: number) => void): void {
    this.container = container;
    this.content = content;
    this.onChange = onChange;

    document.addEventListener('keydown', this.keyHandler);
    container.addEventListener('wheel', this.wheelHandler, { passive: false });

    this.applyZoom();
  }

  detach(): void {
    document.removeEventListener('keydown', this.keyHandler);
    if (this.container) {
      this.container.removeEventListener('wheel', this.wheelHandler);
    }
    this.container = null;
    this.content = null;
  }

  setZoom(level: number): void {
    this.level = Math.max(this.min, Math.min(this.max, level));
    this.applyZoom();
    this.onChange?.(this.level);
  }

  getZoom(): number {
    return this.level;
  }

  zoomIn(): void {
    this.setZoom(this.level + this.step);
  }

  zoomOut(): void {
    this.setZoom(this.level - this.step);
  }

  resetZoom(): void {
    this.setZoom(1);
  }

  fitToWidth(): void {
    if (!this.container || !this.content) return;

    const containerWidth = this.container.clientWidth - 32; // padding
    const contentWidth = this.content.scrollWidth / this.level;

    if (contentWidth > 0) {
      this.setZoom(containerWidth / contentWidth);
    }
  }

  private applyZoom(): void {
    if (!this.content) return;
    this.content.style.transform = `scale(${this.level})`;
    this.content.style.transformOrigin = 'top center';
  }

  private handleKeyboard(e: KeyboardEvent): void {
    const isMod = e.ctrlKey || e.metaKey;
    if (!isMod) return;

    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      this.zoomIn();
    } else if (e.key === '-') {
      e.preventDefault();
      this.zoomOut();
    } else if (e.key === '0') {
      e.preventDefault();
      this.resetZoom();
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (!e.ctrlKey && !e.metaKey) return;

    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    this.setZoom(this.level + delta);
  }
}

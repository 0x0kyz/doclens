import { BaseRenderer } from './BaseRenderer';
import type { RendererContext, SearchResult } from '../types';

export class VideoRenderer extends BaseRenderer {
  private objectUrl: string | null = null;

  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const wrapper = document.createElement('div');
    wrapper.className = 'dv-media-viewer';

    const video = document.createElement('video');
    video.controls = true;
    video.preload = 'metadata';

    const blob = new Blob([ctx.data]);
    this.objectUrl = URL.createObjectURL(blob);
    video.src = this.objectUrl;

    wrapper.appendChild(video);
    ctx.container.appendChild(wrapper);
    this.contentEl = wrapper;
  }

  search(): SearchResult[] {
    return [];
  }

  destroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    super.destroy();
  }
}

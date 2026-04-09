---
sidebar_position: 4
title: Custom Renderers
---

# Custom Renderers

doclens uses a plugin architecture for file format support. You can register custom renderers for any file type.

## Creating a Renderer

Extend `BaseRenderer` and implement the `render` method:

```ts
import { registerRenderer, BaseRenderer } from 'doclens';
import type { RendererContext } from 'doclens';

class MyCustomRenderer extends BaseRenderer {
  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const text = new TextDecoder().decode(ctx.data);
    const container = document.createElement('div');
    container.className = 'my-renderer';
    container.innerHTML = `<pre>${text}</pre>`;
    ctx.container.appendChild(container);

    // Enable search within the rendered content
    this.contentEl = container;
  }
}

registerRenderer('custom-type', MyCustomRenderer);
```

## `BaseRenderer` Features

`BaseRenderer` provides built-in search support via a `Highlighter` instance. Once you set `this.contentEl`, search queries will automatically find and highlight text matches in the rendered DOM.

### Methods You Can Override

| Method | Purpose |
|--------|---------|
| `render(ctx)` | Render the document into `ctx.container` |
| `destroy()` | Clean up resources |
| `search(query, options)` | Custom search logic |
| `highlightMatch(index)` | Custom highlight behavior |
| `clearHighlights()` | Custom clear behavior |
| `getPageCount()` | Return total page count |
| `getCurrentPage()` | Return current page number |
| `goToPage(page)` | Navigate to a specific page |
| `getOutline()` | Return bookmarks/TOC |
| `getTextContent()` | Return full text content |
| `rotate(degrees)` | Rotate the document |

## Registration

Register before loading a document. The `fileType` string matches against the detected file type:

```ts
import { registerRenderer } from 'doclens';

registerRenderer('my-format', MyCustomRenderer);
```

For lazy loading, use the factory variant:

```ts
import { registerRendererFactory } from 'doclens';

registerRendererFactory('my-format', async () => {
  const { MyRenderer } = await import('./MyRenderer');
  return new MyRenderer();
});
```

## Example: Log File Viewer

```ts
class LogRenderer extends BaseRenderer {
  async render(ctx: RendererContext): Promise<void> {
    await super.render(ctx);

    const text = new TextDecoder().decode(ctx.data);
    const container = document.createElement('div');
    container.style.fontFamily = 'monospace';
    container.style.whiteSpace = 'pre-wrap';
    container.style.padding = '16px';

    const lines = text.split('\n');
    for (const line of lines) {
      const el = document.createElement('div');
      el.textContent = line;

      if (line.includes('ERROR')) {
        el.style.color = '#ef4444';
        el.style.fontWeight = 'bold';
      } else if (line.includes('WARN')) {
        el.style.color = '#f59e0b';
      }

      container.appendChild(el);
    }

    ctx.container.appendChild(container);
    this.contentEl = container;
  }
}

registerRenderer('log', LogRenderer);
```

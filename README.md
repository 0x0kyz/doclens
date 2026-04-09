# DocLens

**Universal document viewer for the web.** Framework-agnostic core with a React wrapper. Renders PDF, XLSX, XLS, CSV, PPTX, DOCX, XML, JSON, HTML, Markdown, images, video, audio, and plain text — with unified search, keyword highlighting, zoom, and deep customization.

## Features

- **14+ file formats** rendered client-side with no server required
- **Unified search & highlight** across all text-based formats
- **OCR support**: search text in images and scanned PDFs via Tesseract.js with word-level highlight overlays
- **Pre-search**: pass an array of terms to auto-highlight and scroll to on load
- **Keyboard navigation**: Enter/Shift+Enter to jump between search results
- **Zoom controls** with pinch-to-zoom, Ctrl+/- shortcuts, and fit-to-width
- **Remote URL support**: S3 pre-signed URLs, CDN links, authenticated API endpoints
- **Multi-document tabs**: switch between multiple documents in one viewer
- **Password-protected PDFs**: automatic password prompt dialog
- **Bookmarks / TOC**: extracted from PDF, DOCX, and Markdown headings
- **Dark mode**: built-in light and dark themes with CSS custom properties
- **Framework-agnostic**: core engine works with vanilla JS; React wrapper for convenience
- **Tree-shakeable**: format-specific dependencies are dynamically imported
- **Customizable**: CSS variables, render slots, custom renderers, component overrides

## Installation

```bash
npm install doclens
```

### Optional peer dependencies

Install only the ones you need — DocLens lazy-loads them:

```bash
# PDF support (PDFium-powered, Chrome-grade rendering)
npm install pdfnova

# Excel (XLSX/XLS) support
npm install xlsx

# CSV support
npm install papaparse

# Word (DOCX) support
npm install mammoth

# Markdown support
npm install marked

# OCR support (search text in images and scanned PDFs)
npm install tesseract.js
```

## Quick Start

### React

```tsx
import { DocViewer } from 'doclens';

function App() {
  return (
    <DocViewer
      document={{ uri: '/report.pdf', fileName: 'Q4 Report.pdf' }}
      initialSearchTerms={['revenue', 'growth']}
      theme="dark"
      height={700}
      onDocumentLoad={(meta) => console.log('Loaded:', meta)}
    />
  );
}
```

### Vanilla JavaScript

```ts
import { DocViewerEngine } from 'doclens/core';

const container = document.getElementById('viewer')!;
const engine = new DocViewerEngine(container, {
  document: { uri: 'https://cdn.example.com/file.pdf' },
  initialSearchTerms: ['revenue'],
  theme: 'dark',
});

await engine.load();

// Programmatic search
engine.search('quarterly');
engine.nextMatch();
engine.setZoom(1.5);

// Cleanup
engine.destroy();
```

## Document Sources

DocLens accepts documents from multiple source types:

```tsx
// Remote URL (S3, CDN, any HTTP endpoint)
<DocViewer
  document={{
    uri: 'https://my-bucket.s3.amazonaws.com/docs/report.xlsx?X-Amz-Signature=...',
    fileName: 'Q4 Report.xlsx',
  }}
/>

// Authenticated endpoint
<DocViewer
  document={{
    uri: 'https://api.example.com/documents/123/download',
    fileName: 'Contract.pdf',
    requestInit: {
      headers: { Authorization: 'Bearer eyJ...' },
      credentials: 'include',
    },
  }}
/>

// File from <input> or drag-and-drop
<DocViewer
  document={{
    fileData: file,          // File object
    fileName: file.name,
    fileType: file.type,
  }}
/>

// Raw ArrayBuffer
<DocViewer
  document={{
    fileData: arrayBuffer,
    fileType: 'application/pdf',
    fileName: 'Invoice.pdf',
  }}
/>

// Base64 data URI
<DocViewer
  document={{ uri: 'data:application/pdf;base64,JVBERi0xLjQ...' }}
/>
```

## Multi-Document Tabs

```tsx
<DocViewer
  documents={[
    { uri: '/report.pdf', fileName: 'Report.pdf' },
    { uri: '/data.xlsx', fileName: 'Data.xlsx' },
    { uri: '/notes.md', fileName: 'Notes.md' },
  ]}
  activeDocument={0}
  onDocumentChange={(index, doc) => console.log('Switched to', doc.fileName)}
/>
```

## Pre-Search & Auto-Highlight

Pass `initialSearchTerms` to highlight terms as soon as the document loads. The viewer automatically scrolls to the first match.

```tsx
<DocViewer
  document={{ uri: '/contract.pdf' }}
  initialSearchTerms={['liability', 'indemnification', 'termination']}
/>
```

Each term gets a distinct highlight color (up to 5 built-in colors, customizable via CSS).

## Supported Formats

| Format | Extension | Library Used | Search Support |
|--------|-----------|-------------|---------------|
| PDF | .pdf | pdfnova | Yes (text layer + OCR fallback for scanned pages) |
| Excel | .xlsx, .xls | xlsx (SheetJS) | Yes (cell matching) |
| CSV | .csv | papaparse | Yes (cell matching) |
| PowerPoint | .pptx | Built-in parser | Yes (slide text) |
| Word | .docx | mammoth | Yes (full text) |
| XML | .xml | Built-in DOMParser | Yes (full text) |
| JSON | .json | Built-in JSON.parse | Yes (tree view) |
| HTML | .html, .htm | Shadow DOM | Yes (DOM traversal) |
| Markdown | .md | marked | Yes (full text) |
| Images | .png, .jpg, .gif, .webp, .svg, .bmp | Native `<img>` + tesseract.js (OCR) | Yes (OCR with word-level highlight overlays) |
| Video | .mp4, .webm, .ogg | Native `<video>` | No |
| Audio | .mp3, .wav, .flac | Native `<audio>` | No |
| Plain Text | .txt, .log, .cfg | None | Yes (full text) |

## Props API

### `<DocViewer>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `DocumentSource` | — | Single document source |
| `documents` | `DocumentSource[]` | — | Multiple documents (renders tabs) |
| `activeDocument` | `number` | `0` | Index of active document |
| `initialSearchTerms` | `string[]` | — | Terms to highlight on load |
| `theme` | `'light' \| 'dark' \| ThemeConfig` | `'light'` | Theme preset or custom |
| `header` | `boolean \| HeaderConfig` | `true` | Toolbar configuration |
| `defaultZoom` | `number` | `1` | Initial zoom level |
| `minZoom` | `number` | `0.25` | Minimum zoom |
| `maxZoom` | `number` | `5` | Maximum zoom |
| `zoomStep` | `number` | `0.25` | Zoom increment |
| `disableSelection` | `boolean` | `false` | Disable text selection |
| `disablePrint` | `boolean` | `false` | Disable printing |
| `enableOCR` | `boolean` | `false` | Enable OCR for images and scanned PDFs (requires `tesseract.js`) |
| `height` | `string \| number` | `600` | Viewer height |
| `width` | `string \| number` | `'100%'` | Viewer width |
| `onDocumentLoad` | `(meta) => void` | — | Document loaded callback |
| `onDocumentChange` | `(index, doc) => void` | — | Tab switch callback |
| `onError` | `(error) => void` | — | Error callback |
| `onSearchChange` | `(query, results) => void` | — | Search results callback |
| `onDrop` | `(files) => void` | — | Drag-and-drop callback |
| `renderHeaderLeft` | `() => ReactNode` | — | Custom left header slot |
| `renderHeaderCenter` | `() => ReactNode` | — | Custom center header slot |
| `renderHeaderRight` | `() => ReactNode` | — | Custom right header slot |
| `className` | `string` | — | Root class name |
| `style` | `CSSProperties` | — | Root inline styles |

### `DocumentSource`

```ts
interface DocumentSource {
  uri?: string;              // URL or data URI
  fileData?: ArrayBuffer | Blob | Uint8Array | File;
  fileName?: string;         // Display name
  fileType?: string;         // MIME type override
  requestInit?: RequestInit; // Fetch options (headers, credentials)
}
```

## Theming

### CSS Custom Properties

Override any variable on your container:

```css
.my-viewer {
  --dv-bg: #1a1a2e;
  --dv-text: #eee;
  --dv-primary: #e94560;
  --dv-highlight-color: #ffeb3b;
  --dv-toolbar-bg: #16213e;
}
```

### Theme Object

```tsx
<DocViewer
  theme={{
    preset: 'dark',
    variables: {
      '--dv-primary': '#e94560',
      '--dv-highlight-color': '#ffd700',
    },
  }}
/>
```

### Available CSS Variables

| Variable | Description |
|----------|-------------|
| `--dv-bg` | Background color |
| `--dv-text` | Text color |
| `--dv-primary` | Primary accent color |
| `--dv-toolbar-bg` | Toolbar background |
| `--dv-highlight-color` | Search highlight color |
| `--dv-highlight-active-color` | Active match highlight |
| `--dv-highlight-term-1` through `--dv-highlight-term-5` | Per-term highlight colors |
| `--dv-border` | Border color |
| `--dv-font-family` | Font family |
| `--dv-font-size` | Base font size |
| `--dv-border-radius` | Border radius |

## Custom Renderers

Register a custom renderer for any file type:

```ts
import { registerRenderer, BaseRenderer } from 'doclens';

class MyCustomRenderer extends BaseRenderer {
  async render(ctx) {
    const text = new TextDecoder().decode(ctx.data);
    ctx.container.innerHTML = `<div class="my-renderer">${text}</div>`;
    this.highlighter.setContainer(ctx.container);
  }
}

registerRenderer('custom-type', MyCustomRenderer);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Focus search bar |
| `Enter` | Next search match |
| `Shift + Enter` | Previous search match |
| `Escape` | Clear search |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |

## Exported Hooks

For advanced React usage:

```tsx
import { useDocViewerContext, useSearch, useZoom } from 'doclens';

function CustomToolbar() {
  const { query, count, activeIndex, search, nextMatch, prevMatch } = useSearch();
  const { level, zoomIn, zoomOut, percentage } = useZoom();

  return (
    <div>
      <input value={query} onChange={(e) => search(e.target.value)} />
      <span>{activeIndex + 1} / {count}</span>
      <button onClick={prevMatch}>Prev</button>
      <button onClick={nextMatch}>Next</button>
      <span>{percentage}%</span>
      <button onClick={zoomOut}>-</button>
      <button onClick={zoomIn}>+</button>
    </div>
  );
}
```

## Running the Demo

```bash
cd doclens
npm install
npm run demo
```

Open http://localhost:3200 to see the interactive demo with sample files for each format.

## OCR (Optical Character Recognition)

DocLens supports OCR via [Tesseract.js](https://github.com/naptha/tesseract.js) for searching text within images and scanned PDFs.

**How it works:**

- **Images**: When an image is loaded, Tesseract.js runs OCR in the background. Once complete, the search bar can find text in the image with word-level positioned highlight overlays.
- **Scanned PDFs**: During rendering, DocLens detects pages with no embedded text (scanned/image-only pages). On the first search, these pages are OCR-processed and word-level highlights are overlaid on the canvas.
- **Progressive**: OCR runs asynchronously. Search results from native text appear immediately; OCR results are appended as they become available.

Install `tesseract.js` to enable:

```bash
npm install tesseract.js
```

If `tesseract.js` is not installed, images return no search results and scanned PDF pages are skipped — everything else works normally.

## Architecture

```
src/
  core/                      # Framework-agnostic (vanilla TS)
    engine.ts                # DocViewerEngine orchestrator
    types.ts                 # All TypeScript interfaces
    source-resolver.ts       # URL/File/ArrayBuffer → ArrayBuffer
    file-detection.ts        # MIME/extension/magic-byte detection
    ocr/
      OCREngine.ts           # Tesseract.js wrapper for OCR text extraction
    search/
      SearchEngine.ts        # Unified search API
      highlighter.ts         # DOM text-node highlight/unhighlight
    renderers/
      BaseRenderer.ts        # Abstract base class
      registry.ts            # Lazy-loading renderer registry
      PDFRenderer.ts         # pdfjs-dist
      SpreadsheetRenderer.ts # xlsx + papaparse
      ...12 more renderers
    zoom/
      ZoomManager.ts         # CSS transform zoom + keyboard/pinch
  react/                     # React wrapper
    DocViewer.tsx            # Main component
    context/                 # React context
    hooks/                   # useDocViewer, useSearch, useZoom
    components/              # Header, SearchBar, ZoomControls, etc.
    styles/                  # CSS with custom properties
```

## License

MIT

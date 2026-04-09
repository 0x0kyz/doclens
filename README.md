<p align="center">
  <h1 align="center">doclens</h1>
  <p align="center">
    <strong>Universal document viewer for the web.</strong>
  </p>
  <p align="center">
    One component. Any file. Full-text search with OCR.
  </p>
  <p align="center">
    <a href="https://amit641.github.io/doclens/">Docs</a> · <a href="#install">Install</a> · <a href="#quick-start">Quick Start</a> · <a href="#supported-formats">Formats</a> · <a href="#ocr">OCR</a> · <a href="#theming">Theming</a> · <a href="#api-reference">API</a>
  </p>
</p>

---

```bash
npm install doclens
```

```tsx
import { DocViewer } from 'doclens';

<DocViewer document={{ uri: '/report.pdf' }} />
```

That's it. Renders PDFs, spreadsheets, presentations, code, media, and more — with search, zoom, and dark mode built in.

---

## Why doclens?

| | doclens | react-doc-viewer | @cyntler/react-doc-viewer |
|---|---|---|---|
| **Formats** | 14+ (PDF, XLSX, CSV, PPTX, DOCX, XML, JSON, HTML, MD, images, video, audio, text) | 7 | 7 |
| **Search** | Unified across all formats with highlighting & keyboard nav | None | None |
| **OCR** | Tesseract.js for scanned PDFs and images | None | None |
| **PDF engine** | PDFium via pdfnova (Chrome-grade rendering) | PDF.js | Google Docs iframe |
| **Pre-search** | Auto-highlight terms on load | None | None |
| **Zoom** | Keyboard, pinch, fit-to-width | Basic | None |
| **Theming** | CSS variables, light/dark presets | Limited | Limited |
| **Multi-document** | Tabbed UI with switcher | None | None |
| **TypeScript** | First-class, fully typed | Partial | Yes |
| **Tree-shakeable** | Dynamic imports per format | No | No |
| **Bundle impact** | ~6 KB core + format-specific chunks | Monolithic | Monolithic |

## Install

```bash
npm install doclens    # npm
pnpm add doclens       # pnpm
yarn add doclens       # yarn
```

### Optional peer dependencies

Install only the renderers you need — doclens lazy-loads them:

```bash
npm install pdfnova          # PDF (PDFium-powered, Chrome-grade)
npm install xlsx             # Excel (XLSX/XLS)
npm install papaparse        # CSV
npm install mammoth          # Word (DOCX)
npm install marked           # Markdown
npm install tesseract.js     # OCR (search text in images / scanned PDFs)
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

const engine = new DocViewerEngine(document.getElementById('viewer')!, {
  document: { uri: '/file.pdf' },
  theme: 'dark',
});

await engine.load();
engine.search('quarterly');
engine.nextMatch();
engine.setZoom(1.5);

engine.destroy();
```

## Document Sources

```tsx
// Remote URL (S3, CDN, any HTTP endpoint)
<DocViewer document={{ uri: 'https://bucket.s3.amazonaws.com/report.xlsx' }} />

// Authenticated endpoint
<DocViewer
  document={{
    uri: 'https://api.example.com/documents/123/download',
    requestInit: { headers: { Authorization: 'Bearer eyJ...' } },
  }}
/>

// File from <input> or drag-and-drop
<DocViewer document={{ fileData: file, fileName: file.name, fileType: file.type }} />

// Raw ArrayBuffer
<DocViewer document={{ fileData: arrayBuffer, fileType: 'application/pdf' }} />

// Base64 data URI
<DocViewer document={{ uri: 'data:application/pdf;base64,JVBERi0xLjQ...' }} />
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

Pass `initialSearchTerms` to highlight terms on load. The viewer scrolls to the first match automatically.

```tsx
<DocViewer
  document={{ uri: '/contract.pdf' }}
  initialSearchTerms={['liability', 'indemnification', 'termination']}
/>
```

Each term gets a distinct highlight color (5 built-in, customizable via CSS).

## OCR

doclens supports OCR via [Tesseract.js](https://github.com/naptha/tesseract.js) for finding text inside images and scanned PDFs.

```tsx
<DocViewer document={{ uri: '/scanned-invoice.pdf' }} enableOCR />
```

**How it works:**

- OCR processing starts eagerly when the document loads — by the time you search, results are usually ready
- Text-layer matches and OCR matches are merged and sorted by document position (page, then top-to-bottom)
- If OCR is still processing when you search, the count shows `"1 of 27+"` with a spinner, then updates when ready
- Spatial deduplication prevents double-highlighting text found by both the PDF engine and OCR

```bash
npm install tesseract.js  # required for OCR
```

If `tesseract.js` is not installed, OCR is skipped silently — everything else works normally.

## Supported Formats

| Format | Extension | Library | Search |
|--------|-----------|---------|--------|
| PDF | .pdf | pdfnova (PDFium) | Yes (text layer + OCR) |
| Excel | .xlsx, .xls | xlsx (SheetJS) | Yes (cell matching) |
| CSV | .csv | papaparse | Yes |
| PowerPoint | .pptx | Built-in | Yes (slide text) |
| Word | .docx | mammoth | Yes |
| XML | .xml | Built-in DOMParser | Yes |
| JSON | .json | Built-in | Yes (tree view) |
| HTML | .html | Shadow DOM | Yes |
| Markdown | .md | marked | Yes |
| Images | .png, .jpg, .gif, .webp, .svg | Native + OCR | Yes (via OCR) |
| Video | .mp4, .webm, .ogg | Native `<video>` | No |
| Audio | .mp3, .wav, .flac | Native `<audio>` | No |
| Plain Text | .txt, .log, .cfg | None | Yes |

## Theming

### Presets

```tsx
<DocViewer theme="dark" />
<DocViewer theme="light" />
```

### CSS Custom Properties

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

### Available Variables

| Variable | Description |
|----------|-------------|
| `--dv-bg` | Background color |
| `--dv-text` | Text color |
| `--dv-primary` | Primary accent color |
| `--dv-toolbar-bg` | Toolbar background |
| `--dv-highlight-color` | Search highlight color |
| `--dv-highlight-active-color` | Active match highlight |
| `--dv-highlight-term-1` to `--dv-highlight-term-5` | Per-term colors |
| `--dv-border` | Border color |
| `--dv-font-family` | Font family |
| `--dv-font-size` | Base font size |
| `--dv-border-radius` | Border radius |

## Custom Renderers

Register a custom renderer for any file type:

```ts
import { registerRenderer, BaseRenderer } from 'doclens';

class MyRenderer extends BaseRenderer {
  async render(ctx) {
    const text = new TextDecoder().decode(ctx.data);
    ctx.container.innerHTML = `<div>${text}</div>`;
    this.highlighter.setContainer(ctx.container);
  }
}

registerRenderer('custom-type', MyRenderer);
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Next search match |
| `Shift + Enter` | Previous search match |
| `Escape` | Clear search |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |
| `Ctrl/Cmd + 0` | Reset zoom |

## API Reference

### `<DocViewer>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `DocumentSource` | — | Single document source |
| `documents` | `DocumentSource[]` | — | Multiple documents (renders tabs) |
| `activeDocument` | `number` | `0` | Active document index |
| `initialSearchTerms` | `string[]` | — | Terms to highlight on load |
| `theme` | `'light' \| 'dark' \| ThemeConfig` | `'light'` | Theme |
| `header` | `boolean \| HeaderConfig` | `true` | Toolbar configuration |
| `defaultZoom` | `number` | `1` | Initial zoom level |
| `minZoom` / `maxZoom` | `number` | `0.25` / `5` | Zoom bounds |
| `zoomStep` | `number` | `0.25` | Zoom increment |
| `disableSelection` | `boolean` | `false` | Disable text selection |
| `disablePrint` | `boolean` | `false` | Disable printing |
| `enableOCR` | `boolean` | `false` | Enable OCR (requires `tesseract.js`) |
| `height` | `string \| number` | `'100%'` | Viewer height |
| `width` | `string \| number` | `'100%'` | Viewer width |
| `onDocumentLoad` | `(meta) => void` | — | Document loaded callback |
| `onDocumentChange` | `(index, doc) => void` | — | Tab switch callback |
| `onError` | `(error) => void` | — | Error callback |
| `onSearchChange` | `(query, results) => void` | — | Search results callback |
| `onDrop` | `(files) => void` | — | Drag-and-drop callback |
| `renderHeaderLeft/Center/Right` | `() => ReactNode` | — | Header slot overrides |
| `className` | `string` | — | Root class name |
| `style` | `CSSProperties` | — | Root inline styles |

### `DocumentSource`

```ts
interface DocumentSource {
  uri?: string;
  fileData?: ArrayBuffer | Blob | Uint8Array | File;
  fileName?: string;
  fileType?: string;
  requestInit?: RequestInit;
}
```

### `DocViewerEngine` (Vanilla JS)

```ts
const engine = new DocViewerEngine(container, options);

await engine.load(source?);
engine.search(query);
engine.nextMatch();
engine.prevMatch();
engine.clearSearch();
engine.setZoom(level);
engine.zoomIn();
engine.zoomOut();
engine.goToPage(page);
engine.rotate(degrees);
engine.destroy();

engine.on('load', (meta) => { });
engine.on('search', ({ query, results }) => { });
engine.on('zoom', ({ level }) => { });
engine.on('error', (error) => { });
engine.on('ocrProgress', ({ processing }) => { });
```

### React Hooks

```tsx
import { useDocViewerContext, useSearch, useZoom } from 'doclens';

function CustomToolbar() {
  const { query, count, activeIndex, search, nextMatch, prevMatch } = useSearch();
  const { level, zoomIn, zoomOut, percentage } = useZoom();

  return (
    <div>
      <input value={query} onChange={(e) => search(e.target.value)} />
      <span>{activeIndex + 1} / {count}</span>
      <button onClick={zoomOut}>-</button>
      <span>{percentage}%</span>
      <button onClick={zoomIn}>+</button>
    </div>
  );
}
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│           DocViewer (React) / Engine (Vanilla)   │  ← Public API
├─────────────────────────────────────────────────┤
│  SearchEngine  │  ZoomManager  │  SourceResolver │  ← Core services
├───────┬────────┬────────┬──────┬────────────────┤
│  PDF  │ XLSX   │ DOCX   │ JSON │ 10 more...     │  ← Renderers (lazy)
├───────┴────────┴────────┴──────┴────────────────┤
│  pdfnova │ xlsx │ mammoth │ marked │ tesseract   │  ← Optional deps
└─────────────────────────────────────────────────┘
```

**Design principles:**
- **Framework-agnostic core** — vanilla TypeScript engine, React wrapper for convenience
- **Dynamic imports** — format-specific deps load only when needed
- **Plugin architecture** — register custom renderers without modifying core
- **CSS custom properties** — full visual customization without JS
- **SSR-safe** — no browser API access during initialization

## Running the Demo

```bash
git clone https://github.com/amit641/doclens.git
cd doclens
npm install
npm run demo
```

Open http://localhost:3200 — interactive demo with sample files for every format.

## License

MIT

---
sidebar_position: 10
title: API Reference
---

# API Reference

## `<DocViewer>` React Component

The main React component. Renders a document viewer with toolbar, search, zoom, and all features.

```tsx
import { DocViewer } from 'doclens';

<DocViewer
  document={{ uri: '/report.pdf' }}
  theme="dark"
  enableOCR
  onDocumentLoad={(meta) => console.log(meta)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `DocumentSource` | — | Single document source |
| `documents` | `DocumentSource[]` | — | Multiple documents (renders tabs) |
| `activeDocument` | `number` | `0` | Active document index |
| `initialSearchTerms` | `string[]` | — | Terms to highlight on load |
| `theme` | `'light' \| 'dark' \| ThemeConfig` | `'light'` | Theme |
| `header` | `boolean \| HeaderConfig` | `true` | Toolbar configuration |
| `defaultZoom` | `number` | `1` | Initial zoom level |
| `minZoom` | `number` | `0.25` | Minimum zoom |
| `maxZoom` | `number` | `5` | Maximum zoom |
| `zoomStep` | `number` | `0.25` | Zoom increment |
| `disableSelection` | `boolean` | `false` | Disable text selection |
| `disablePrint` | `boolean` | `false` | Disable printing |
| `enableOCR` | `boolean` | `false` | Enable OCR (requires `tesseract.js`) |
| `height` | `string \| number` | `'100%'` | Viewer height |
| `width` | `string \| number` | `'100%'` | Viewer width |
| `onDocumentLoad` | `(meta: DocumentMeta) => void` | — | Document loaded |
| `onDocumentChange` | `(index: number, doc: DocumentSource) => void` | — | Tab switch |
| `onError` | `(error: Error) => void` | — | Error |
| `onSearchChange` | `(query: string, results: SearchResult[]) => void` | — | Search results |
| `onDrop` | `(files: File[]) => void` | — | File drop |
| `renderHeaderLeft` | `() => ReactNode` | — | Left header slot |
| `renderHeaderCenter` | `() => ReactNode` | — | Center header slot |
| `renderHeaderRight` | `() => ReactNode` | — | Right header slot |
| `className` | `string` | — | Root class name |
| `style` | `CSSProperties` | — | Root styles |

---

## `DocViewerEngine`

The framework-agnostic core engine. Used directly for vanilla JS or advanced React integrations.

```ts
import { DocViewerEngine } from 'doclens/core';

const engine = new DocViewerEngine(container, options, engineMode?);
```

### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | DOM element to render into |
| `options` | `DocViewerOptions` | Configuration options |
| `engineMode` | `EngineMode` | Optional: `{ mode: 'managed' \| 'headless', viewerEl? }` |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `load(source?)` | `Promise<void>` | Load and render a document |
| `loadDocument(index)` | `Promise<void>` | Switch to document by index |
| `search(query)` | `SearchResult[]` | Search and highlight |
| `nextMatch()` | `number` | Navigate to next match |
| `prevMatch()` | `number` | Navigate to previous match |
| `clearSearch()` | `void` | Clear search highlights |
| `getSearchResults()` | `SearchResult[]` | Get current results |
| `getActiveSearchIndex()` | `number` | Get active match index |
| `setZoom(level)` | `void` | Set zoom level |
| `getZoom()` | `number` | Get current zoom |
| `zoomIn()` | `void` | Zoom in by step |
| `zoomOut()` | `void` | Zoom out by step |
| `resetZoom()` | `void` | Reset to 1x |
| `fitToWidth()` | `void` | Fit to container width |
| `getPageCount()` | `number` | Total pages |
| `getCurrentPage()` | `number` | Current page |
| `goToPage(page)` | `void` | Navigate to page |
| `rotate(degrees?)` | `void` | Rotate document |
| `getMeta()` | `DocumentMeta \| null` | Get document metadata |
| `getFileType()` | `FileType \| null` | Get detected file type |
| `destroy()` | `void` | Clean up everything |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `load` | `DocumentMeta` | Document loaded successfully |
| `error` | `Error` | Error occurred |
| `search` | `{ query, results }` | Search results updated |
| `zoom` | `{ level }` | Zoom level changed |
| `pageChange` | `{ page }` | Page changed |
| `documentChange` | `{ index, document }` | Active document changed |
| `ocrProgress` | `{ processing }` | OCR started/finished |

```ts
engine.on('load', (meta) => { });
engine.off('load', callback);
```

---

## React Hooks

### `useSearch()`

```ts
const {
  query,        // string — current query
  results,      // SearchResult[] — all matches
  count,        // number — total count
  activeIndex,  // number — currently highlighted
  search,       // (query: string) => void
  nextMatch,    // () => void
  prevMatch,    // () => void
  clearSearch,  // () => void
} = useSearch();
```

### `useZoom()`

```ts
const {
  level,        // number — current zoom (e.g. 1.5)
  percentage,   // number — as percentage (e.g. 150)
  setZoom,      // (level: number) => void
  zoomIn,       // () => void
  zoomOut,      // () => void
  resetZoom,    // () => void
  fitToWidth,   // () => void
} = useZoom();
```

### `useDocViewerContext()`

Access the full state and actions:

```ts
const { state, actions } = useDocViewerContext();
```

---

## Types

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

### `DocumentMeta`

```ts
interface DocumentMeta {
  fileName: string;
  fileType: FileType;
  pageCount?: number;
  fileSize: number;
}
```

### `SearchResult`

```ts
interface SearchResult {
  index: number;
  node: HTMLElement;
  text: string;
  page?: number;
  termIndex?: number;
}
```

### `FileType`

```ts
type FileType =
  | 'pdf' | 'xlsx' | 'xls' | 'csv' | 'pptx' | 'docx'
  | 'xml' | 'json' | 'html' | 'markdown'
  | 'image' | 'video' | 'audio' | 'text';
```

### `ThemePreset`

```ts
type ThemePreset = 'light' | 'dark';
```

### `ThemeConfig`

```ts
interface ThemeConfig {
  preset?: ThemePreset;
  variables?: Record<string, string>;
}
```

### `HeaderConfig`

```ts
interface HeaderConfig {
  show?: boolean;
  fileName?: boolean;
  search?: boolean;
  zoom?: boolean;
  fullscreen?: boolean;
  download?: boolean;
  print?: boolean;
  pageNav?: boolean;
}
```

### `OutlineItem`

```ts
interface OutlineItem {
  title: string;
  page?: number;
  children?: OutlineItem[];
}
```

### `DocViewerEvent`

```ts
type DocViewerEvent =
  | 'load' | 'error' | 'search' | 'zoom'
  | 'pageChange' | 'documentChange' | 'ocrProgress';
```

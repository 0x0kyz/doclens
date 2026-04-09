---
slug: /
sidebar_position: 1
title: Introduction
---

# doclens

**Universal document viewer for the web.**

One component. Any file. Full-text search with OCR.

```bash
npm install doclens
```

```tsx
import { DocViewer } from 'doclens';

<DocViewer document={{ uri: '/report.pdf' }} />
```

That's it. Renders PDFs, spreadsheets, presentations, code, media, and more — with search, zoom, and dark mode built in.

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

## Features

- **14+ file formats** rendered client-side with no server required
- **Unified search & highlight** across all text-based formats
- **OCR support** — search text in images and scanned PDFs via Tesseract.js
- **Pre-search** — pass terms to auto-highlight and scroll to on load
- **Keyboard navigation** — Enter/Shift+Enter between matches
- **Zoom controls** — pinch-to-zoom, Ctrl+/-, fit-to-width
- **Remote URL support** — S3, CDN, authenticated endpoints
- **Multi-document tabs** — switch between documents in one viewer
- **Password-protected PDFs** — automatic password prompt
- **Dark mode** — light and dark themes with CSS custom properties
- **Framework-agnostic** — core engine works with vanilla JS; React wrapper for convenience
- **Tree-shakeable** — format-specific dependencies are dynamically imported
- **Customizable** — CSS variables, render slots, custom renderers

## Supported Formats

| Format | Extension | Library | Search |
|--------|-----------|---------|--------|
| PDF | .pdf | pdfnova (PDFium) | Yes (text layer + OCR) |
| Excel | .xlsx, .xls | xlsx (SheetJS) | Yes |
| CSV | .csv | papaparse | Yes |
| PowerPoint | .pptx | Built-in | Yes |
| Word | .docx | mammoth | Yes |
| XML | .xml | Built-in | Yes |
| JSON | .json | Built-in | Yes (tree view) |
| HTML | .html | Shadow DOM | Yes |
| Markdown | .md | marked | Yes |
| Images | .png, .jpg, .gif, .webp, .svg | Native + OCR | Yes (via OCR) |
| Video | .mp4, .webm, .ogg | Native | No |
| Audio | .mp3, .wav, .flac | Native | No |
| Plain Text | .txt, .log | None | Yes |

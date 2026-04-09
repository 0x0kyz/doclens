---
sidebar_position: 2
title: Getting Started
---

# Getting Started

## Installation

```bash
npm install doclens    # npm
pnpm add doclens       # pnpm
yarn add doclens       # yarn
```

### Optional peer dependencies

Install only the renderers you need — doclens lazy-loads them at runtime:

```bash
npm install pdfnova          # PDF (PDFium-powered, Chrome-grade)
npm install xlsx             # Excel (XLSX/XLS)
npm install papaparse        # CSV
npm install mammoth          # Word (DOCX)
npm install marked           # Markdown
npm install tesseract.js     # OCR (search text in images / scanned PDFs)
```

If a dependency is not installed, the viewer shows a helpful error message for that format. All other formats continue to work.

## Your First Viewer

```tsx
import { DocViewer } from 'doclens';

function App() {
  return (
    <DocViewer
      document={{ uri: '/report.pdf', fileName: 'Q4 Report.pdf' }}
      height={700}
    />
  );
}
```

## Search on Load

Pass `initialSearchTerms` to highlight terms as soon as the document renders. The viewer scrolls to the first match automatically.

```tsx
<DocViewer
  document={{ uri: '/contract.pdf' }}
  initialSearchTerms={['liability', 'indemnification', 'termination']}
/>
```

Each term gets a distinct highlight color (5 built-in colors, customizable via CSS).

## Dark Mode

```tsx
<DocViewer document={{ uri: '/report.pdf' }} theme="dark" />
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

## Handling Events

```tsx
<DocViewer
  document={{ uri: '/report.pdf' }}
  onDocumentLoad={(meta) => {
    console.log(`Loaded ${meta.fileName} (${meta.pageCount} pages)`);
  }}
  onError={(err) => console.error(err)}
  onSearchChange={(query, results) => {
    console.log(`"${query}": ${results.length} matches`);
  }}
/>
```

## Drag and Drop

```tsx
function App() {
  const [doc, setDoc] = useState(null);

  return (
    <DocViewer
      document={doc}
      onDrop={(files) => {
        const file = files[0];
        setDoc({ fileData: file, fileName: file.name, fileType: file.type });
      }}
    />
  );
}
```

## Next Steps

- [Document Sources](/guides/document-sources) — URLs, files, ArrayBuffers, authenticated endpoints
- [Search & OCR](/guides/search-and-ocr) — unified search, OCR for scanned documents
- [Theming](/guides/theming) — CSS variables, dark mode, custom themes
- [Custom Renderers](/guides/custom-renderers) — extend with your own file type support
- [Vanilla JS](/guides/vanilla-js) — use doclens without React

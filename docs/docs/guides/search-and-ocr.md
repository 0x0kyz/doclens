---
sidebar_position: 2
title: Search & OCR
---

# Search & OCR

doclens provides unified full-text search across all text-based formats with keyboard navigation and visual highlighting.

## Search Bar

The built-in search bar appears in the header toolbar. Type a query and results are highlighted across the entire document. Navigate with:

| Shortcut | Action |
|----------|--------|
| `Enter` | Next match |
| `Shift + Enter` | Previous match |
| `Escape` | Clear search |

The search count shows `"3 of 27"` with up/down arrows for navigation.

## Pre-Search on Load

Pass `initialSearchTerms` to highlight terms as soon as the document loads:

```tsx
<DocViewer
  document={{ uri: '/contract.pdf' }}
  initialSearchTerms={['liability', 'indemnification', 'termination']}
/>
```

- The viewer auto-scrolls to the first match
- Each term gets a distinct highlight color (up to 5 built-in colors)
- Colors are customizable via `--dv-highlight-term-1` through `--dv-highlight-term-5`

## Programmatic Search

Using the engine API or React hooks:

```tsx
import { useSearch } from 'doclens';

function SearchPanel() {
  const { query, count, activeIndex, search, nextMatch, prevMatch, clearSearch } = useSearch();

  return (
    <div>
      <input value={query} onChange={(e) => search(e.target.value)} />
      <span>{activeIndex + 1} / {count}</span>
      <button onClick={prevMatch}>Prev</button>
      <button onClick={nextMatch}>Next</button>
      <button onClick={clearSearch}>Clear</button>
    </div>
  );
}
```

## Search Events

```tsx
<DocViewer
  document={{ uri: '/report.pdf' }}
  onSearchChange={(query, results) => {
    console.log(`"${query}": ${results.length} matches`);
    // results[i].text — matched text
    // results[i].page — page number (PDF)
    // results[i].index — result index
  }}
/>
```

## OCR (Optical Character Recognition)

doclens supports OCR via [Tesseract.js](https://github.com/naptha/tesseract.js) for finding text inside images and scanned PDF pages.

### Enable OCR

```tsx
<DocViewer document={{ uri: '/scanned-invoice.pdf' }} enableOCR />
```

```bash
npm install tesseract.js  # required for OCR
```

### How It Works

1. **Eager processing** — OCR starts as soon as the PDF loads, not when you search. By the time you type a query, OCR data is usually ready.

2. **Mixed-content PDFs** — pages with both embedded text and images are handled correctly. The PDF engine finds text-layer matches while OCR finds text in images. Results are merged with spatial deduplication (OCR results that overlap existing text-layer matches are skipped).

3. **Sorted navigation** — all results (text-layer and OCR) are sorted by page number and vertical position, so navigation follows the natural reading order.

4. **Progressive UX** — if OCR is still processing when you search, the count shows `"1 of 27+"` with a spinner. Once OCR finishes, results update automatically (e.g., to `"1 of 44"`). If you wait for OCR to complete before searching, all results appear immediately.

5. **Image files** — standalone images (PNG, JPG, etc.) are also OCR-processed when `enableOCR` is true, enabling search within photos, screenshots, and scanned documents.

### OCR Progress Events

```tsx
<DocViewer
  document={{ uri: '/scanned.pdf' }}
  enableOCR
  onSearchChange={(query, results) => {
    // Called initially with text-layer results,
    // then again when OCR results are ready
  }}
/>
```

The engine also emits `ocrProgress` events:

```ts
engine.on('ocrProgress', ({ processing }) => {
  if (processing) {
    showSpinner();
  } else {
    hideSpinner();
  }
});
```

### Without Tesseract.js

If `tesseract.js` is not installed, OCR is skipped silently. Text-layer search for PDFs and all other formats work normally. No errors are thrown.

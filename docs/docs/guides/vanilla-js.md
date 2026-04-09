---
sidebar_position: 5
title: Vanilla JavaScript
---

# Vanilla JavaScript

doclens has a framework-agnostic core that works without React. Import from `doclens/core` to use `DocViewerEngine` directly.

## Basic Usage

```ts
import { DocViewerEngine } from 'doclens/core';

const container = document.getElementById('viewer')!;

const engine = new DocViewerEngine(container, {
  document: { uri: 'https://cdn.example.com/report.pdf' },
  theme: 'dark',
  defaultZoom: 1,
});

await engine.load();
```

## Search

```ts
const results = engine.search('revenue');
console.log(`Found ${results.length} matches`);

engine.nextMatch();  // navigate to next
engine.prevMatch();  // navigate to previous
engine.clearSearch();
```

## Zoom

```ts
engine.setZoom(1.5);
engine.zoomIn();     // increment by zoomStep
engine.zoomOut();
engine.resetZoom();  // back to 1
engine.fitToWidth();
```

## Page Navigation

```ts
const total = engine.getPageCount();
const current = engine.getCurrentPage();

engine.goToPage(3);
engine.rotate(90);
```

## Events

```ts
engine.on('load', (meta) => {
  console.log(`Loaded ${meta.fileName} — ${meta.pageCount} pages, ${meta.fileSize} bytes`);
});

engine.on('search', ({ query, results }) => {
  console.log(`"${query}": ${results.length} matches`);
});

engine.on('zoom', ({ level }) => {
  console.log(`Zoom: ${Math.round(level * 100)}%`);
});

engine.on('error', (error) => {
  console.error(error.message);
});

engine.on('ocrProgress', ({ processing }) => {
  toggleSpinner(processing);
});
```

## Multi-Document

```ts
const engine = new DocViewerEngine(container, {
  documents: [
    { uri: '/report.pdf', fileName: 'Report' },
    { uri: '/data.xlsx', fileName: 'Data' },
  ],
  activeDocument: 0,
});

await engine.load();

// Switch to second document
await engine.loadDocument(1);
```

## Headless Mode

By default, `DocViewerEngine` creates its own DOM structure. In headless mode, you provide the containers:

```ts
const content = document.getElementById('content')!;
const viewer = document.getElementById('viewer')!;

const engine = new DocViewerEngine(content, options, {
  mode: 'headless',
  viewerEl: viewer,
});
```

This is how the React wrapper uses the engine internally.

## Cleanup

Always destroy the engine when done:

```ts
engine.destroy();
```

This cleans up the renderer, zoom manager, search state, event listeners, and DOM elements.

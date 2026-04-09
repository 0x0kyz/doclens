---
sidebar_position: 1
title: Document Sources
---

# Document Sources

doclens accepts documents from many source types through the `DocumentSource` interface:

```ts
interface DocumentSource {
  uri?: string;              // URL or data URI
  fileData?: ArrayBuffer | Blob | Uint8Array | File;
  fileName?: string;         // Display name
  fileType?: string;         // MIME type override
  requestInit?: RequestInit; // Fetch options (headers, credentials)
}
```

## Remote URLs

Any HTTP endpoint — S3 pre-signed URLs, CDN links, API endpoints:

```tsx
<DocViewer
  document={{
    uri: 'https://my-bucket.s3.amazonaws.com/docs/report.xlsx?X-Amz-Signature=...',
    fileName: 'Q4 Report.xlsx',
  }}
/>
```

## Authenticated Endpoints

Pass headers, credentials, or any `RequestInit` option:

```tsx
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
```

## File Input / Drag-and-Drop

Use a `File` object from `<input type="file">` or the Drag and Drop API:

```tsx
<DocViewer
  document={{
    fileData: file,          // File object
    fileName: file.name,
    fileType: file.type,
  }}
/>
```

## Raw ArrayBuffer

Useful when you already have the file data in memory:

```tsx
<DocViewer
  document={{
    fileData: arrayBuffer,
    fileType: 'application/pdf',
    fileName: 'Invoice.pdf',
  }}
/>
```

## Base64 Data URIs

```tsx
<DocViewer document={{ uri: 'data:application/pdf;base64,JVBERi0xLjQ...' }} />
```

## File Type Detection

doclens automatically detects the file type from (in priority order):

1. The `fileType` property (MIME string)
2. The file extension in `fileName` or `uri`
3. Magic bytes in the file data (for binary formats like PDF, XLSX, PPTX)

You can override detection by setting `fileType` explicitly:

```tsx
<DocViewer
  document={{
    uri: 'https://api.example.com/blob/abc123',
    fileType: 'application/pdf',
  }}
/>
```

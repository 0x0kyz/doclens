import type { DocumentSource } from './types';

export async function resolveSource(source: DocumentSource): Promise<ArrayBuffer> {
  if (source.fileData) {
    return resolveFileData(source.fileData);
  }

  if (!source.uri) {
    throw new Error('DocumentSource must have either uri or fileData');
  }

  if (source.uri.startsWith('data:')) {
    return decodeDataUri(source.uri);
  }

  return fetchUrl(source.uri, source.requestInit);
}

async function resolveFileData(
  data: ArrayBuffer | Blob | Uint8Array | File,
): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) {
    return data;
  }

  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
  }

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    return data.arrayBuffer();
  }

  throw new Error('Unsupported fileData type');
}

function decodeDataUri(uri: string): ArrayBuffer {
  const commaIdx = uri.indexOf(',');
  if (commaIdx === -1) throw new Error('Invalid data URI');

  const meta = uri.slice(0, commaIdx);
  const encoded = uri.slice(commaIdx + 1);

  const isBase64 = meta.includes(';base64');

  if (isBase64) {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
  }

  const decoded = decodeURIComponent(encoded);
  const encoder = new TextEncoder();
  return encoder.encode(decoded).buffer as ArrayBuffer;
}

async function fetchUrl(
  url: string,
  init?: RequestInit,
): Promise<ArrayBuffer> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch document: ${response.status} ${response.statusText}`,
    );
  }

  return response.arrayBuffer();
}

export function extractFileName(source: DocumentSource): string {
  if (source.fileName) return source.fileName;
  if (!source.uri) return 'Untitled';

  try {
    const url = new URL(source.uri, window.location.href);
    const pathname = url.pathname;
    const segments = pathname.split('/');
    const last = segments[segments.length - 1];
    if (last) return decodeURIComponent(last);
  } catch {
    // Fallback for relative paths
    const segments = source.uri.split('/');
    const last = segments[segments.length - 1]?.split('?')[0];
    if (last) return decodeURIComponent(last);
  }

  return 'Untitled';
}

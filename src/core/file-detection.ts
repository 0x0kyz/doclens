import type { DocumentSource, FileType } from './types';

const EXTENSION_MAP: Record<string, FileType> = {
  pdf: 'pdf',
  xlsx: 'xlsx',
  xls: 'xls',
  csv: 'csv',
  pptx: 'pptx',
  ppt: 'pptx',
  docx: 'docx',
  doc: 'docx',
  xml: 'xml',
  json: 'json',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
  txt: 'text',
  log: 'text',
  cfg: 'text',
  ini: 'text',
  yaml: 'text',
  yml: 'text',
  // Images
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  bmp: 'image',
  webp: 'image',
  svg: 'image',
  ico: 'image',
  tiff: 'image',
  tif: 'image',
  // Video
  mp4: 'video',
  webm: 'video',
  ogg: 'video',
  mov: 'video',
  avi: 'video',
  // Audio
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  m4a: 'audio',
};

const MIME_MAP: Record<string, FileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'text/csv': 'csv',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'text/xml': 'xml',
  'application/xml': 'xml',
  'application/json': 'json',
  'text/html': 'html',
  'text/markdown': 'markdown',
  'text/plain': 'text',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/bmp': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/flac': 'audio',
  'audio/aac': 'audio',
};

// Magic bytes for binary formats
const MAGIC_BYTES: Array<{ bytes: number[]; offset: number; type: FileType }> = [
  { bytes: [0x25, 0x50, 0x44, 0x46], offset: 0, type: 'pdf' }, // %PDF
  { bytes: [0x50, 0x4b, 0x03, 0x04], offset: 0, type: 'xlsx' }, // ZIP (OOXML)
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], offset: 0, type: 'xls' }, // OLE2
  { bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0, type: 'image' }, // PNG
  { bytes: [0xff, 0xd8, 0xff], offset: 0, type: 'image' }, // JPEG
  { bytes: [0x47, 0x49, 0x46, 0x38], offset: 0, type: 'image' }, // GIF
];

export function detectFileType(
  source: DocumentSource,
  data?: ArrayBuffer,
): FileType {
  // 1. Explicit fileType override
  if (source.fileType) {
    const fromMime = MIME_MAP[source.fileType];
    if (fromMime) return fromMime;

    const lower = source.fileType.toLowerCase() as FileType;
    if (isValidFileType(lower)) return lower;
  }

  // 2. Extension from URI
  if (source.uri) {
    const ext = extractExtension(source.uri);
    if (ext && EXTENSION_MAP[ext]) {
      const detected = EXTENSION_MAP[ext];

      // ZIP-based formats need disambiguation
      if (detected === 'xlsx' && data) {
        return disambiguateZip(data, ext);
      }
      return detected;
    }
  }

  // 3. Extension from fileName
  if (source.fileName) {
    const ext = extractExtension(source.fileName);
    if (ext && EXTENSION_MAP[ext]) {
      return EXTENSION_MAP[ext];
    }
  }

  // 4. Magic bytes
  if (data) {
    const detected = detectFromMagicBytes(data);
    if (detected) {
      if (detected === 'xlsx') {
        return disambiguateZip(data, undefined);
      }
      return detected;
    }

    // 5. Try to detect text-based formats
    return detectTextFormat(data);
  }

  return 'text';
}

function extractExtension(path: string): string | null {
  try {
    const url = new URL(path, 'https://placeholder.local');
    const pathname = url.pathname;
    const dot = pathname.lastIndexOf('.');
    if (dot === -1) return null;
    return pathname.slice(dot + 1).toLowerCase();
  } catch {
    const clean = path.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    if (dot === -1) return null;
    return clean.slice(dot + 1).toLowerCase();
  }
}

function detectFromMagicBytes(data: ArrayBuffer): FileType | null {
  const view = new Uint8Array(data);

  for (const magic of MAGIC_BYTES) {
    if (view.length < magic.offset + magic.bytes.length) continue;
    let match = true;
    for (let i = 0; i < magic.bytes.length; i++) {
      if (view[magic.offset + i] !== magic.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) return magic.type;
  }

  return null;
}

function disambiguateZip(data: ArrayBuffer, ext?: string): FileType {
  // For ZIP-based OOXML formats, check the extension first
  if (ext) {
    const mapped = EXTENSION_MAP[ext];
    if (mapped === 'pptx' || mapped === 'docx' || mapped === 'xlsx') {
      return mapped;
    }
  }

  // Try to peek at the ZIP content types
  const text = tryDecodePartial(data, 2000);
  if (text) {
    if (text.includes('presentation')) return 'pptx';
    if (text.includes('word')) return 'docx';
    if (text.includes('spreadsheet') || text.includes('worksheet')) return 'xlsx';
  }

  return 'xlsx'; // default for unknown ZIP
}

function detectTextFormat(data: ArrayBuffer): FileType {
  const text = tryDecodePartial(data, 500);
  if (!text) return 'text';

  const trimmed = text.trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(new TextDecoder().decode(data));
      return 'json';
    } catch {
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    }
  }

  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    if (trimmed.includes('<?xml') || trimmed.match(/<\w+[\s>]/)) {
      if (trimmed.includes('<!DOCTYPE html') || trimmed.includes('<html')) {
        return 'html';
      }
      if (trimmed.startsWith('<?xml')) return 'xml';
    }
    if (trimmed.includes('<!DOCTYPE html') || trimmed.includes('<html')) {
      return 'html';
    }
  }

  // CSV heuristic: multiple lines with consistent delimiters
  const lines = trimmed.split('\n').slice(0, 5);
  if (lines.length >= 2) {
    const commaCount = lines[0].split(',').length;
    if (commaCount >= 2 && lines.every((l) => Math.abs(l.split(',').length - commaCount) <= 1)) {
      return 'csv';
    }
  }

  // Markdown heuristic
  if (/^#{1,6}\s/.test(trimmed) || /^\*\*/.test(trimmed) || /^-\s/.test(trimmed)) {
    return 'markdown';
  }

  return 'text';
}

function tryDecodePartial(data: ArrayBuffer, maxBytes: number): string | null {
  try {
    const slice = data.slice(0, Math.min(data.byteLength, maxBytes));
    return new TextDecoder('utf-8', { fatal: true }).decode(slice);
  } catch {
    return null;
  }
}

function isValidFileType(value: string): value is FileType {
  const valid: Set<string> = new Set([
    'pdf', 'xlsx', 'xls', 'csv', 'pptx', 'docx',
    'xml', 'json', 'html', 'markdown', 'image',
    'video', 'audio', 'text',
  ]);
  return valid.has(value);
}

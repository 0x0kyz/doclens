export interface OCRWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
}

let tesseractModule: any = null;
let workerInstance: any = null;

const CDN_URL = 'https://esm.sh/tesseract.js@7';

async function loadTesseract(): Promise<any> {
  if (tesseractModule) return tesseractModule;

  // Try npm-installed package first
  try {
    tesseractModule = await import('tesseract.js');
    return tesseractModule;
  } catch {
    // Not installed locally — fall back to CDN
  }

  try {
    tesseractModule = await import(/* @vite-ignore */ CDN_URL);
    return tesseractModule;
  } catch {
    // CDN also unavailable
  }

  throw new Error(
    'tesseract.js could not be loaded. Install it with: npm install tesseract.js',
  );
}

async function getWorker(): Promise<any> {
  if (workerInstance) return workerInstance;
  const mod = await loadTesseract();
  const Tesseract = mod.default ?? mod;
  workerInstance = await Tesseract.createWorker('eng');
  return workerInstance;
}

/**
 * Run OCR on an image source (canvas, img element, blob, or ArrayBuffer).
 * Returns extracted text and word-level bounding boxes for overlay positioning.
 */
export async function recognizeImage(
  source: HTMLCanvasElement | HTMLImageElement | Blob | ArrayBuffer | string,
): Promise<OCRResult> {
  const worker = await getWorker();
  const { data } = await worker.recognize(source, {}, { text: true, blocks: true });

  const words: OCRWord[] = [];
  if (data.blocks) {
    for (const block of data.blocks) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          for (const w of line.words ?? []) {
            words.push({
              text: w.text,
              confidence: w.confidence,
              bbox: w.bbox,
            });
          }
        }
      }
    }
  }

  return {
    text: data.text ?? '',
    confidence: data.confidence ?? 0,
    words,
  };
}

/**
 * Check if tesseract.js is available without throwing.
 */
export async function isOCRAvailable(): Promise<boolean> {
  try {
    await loadTesseract();
    return true;
  } catch {
    return false;
  }
}

/**
 * Terminate the shared worker to free resources.
 */
export async function terminateOCR(): Promise<void> {
  if (workerInstance) {
    try {
      await workerInstance.terminate();
    } catch { /* ignore */ }
    workerInstance = null;
  }
}

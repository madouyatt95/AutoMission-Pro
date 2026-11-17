import type { AppDocument } from '../types';

export function readDocumentFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result) : reject(new Error('Le fichier n’a pas pu être lu.'));
    reader.onerror = () => reject(reader.error ?? new Error('Le fichier n’a pas pu être lu.'));
    reader.onabort = () => reject(new Error('Lecture du fichier interrompue.'));
    reader.readAsDataURL(file);
  });
}

export function documentBytes(document: Pick<AppDocument, 'size' | 'dataUrl'>) {
  if (document.size !== undefined) return document.size;
  if (!document.dataUrl) return 0;
  const separator = document.dataUrl.indexOf(',');
  if (separator < 0) return 0;
  const header = document.dataUrl.slice(0, separator);
  const body = document.dataUrl.slice(separator + 1);
  if (header.endsWith(';base64')) {
    return Math.floor(body.length * 3 / 4) - (body.endsWith('==') ? 2 : body.endsWith('=') ? 1 : 0);
  }
  return new TextEncoder().encode(decodeURIComponent(body)).length;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} octets`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

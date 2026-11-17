import { expect, it } from 'vitest';
import { documentBytes, formatBytes } from '../src/utils/documentFiles';

it('reports actual file sizes, including padding in legacy base64 documents', () => {
  expect(documentBytes({ size: 27, dataUrl: 'data:text/plain;base64,YQ==' })).toBe(27);
  expect(documentBytes({ dataUrl: 'data:text/plain;base64,YQ==' })).toBe(1);
  expect(documentBytes({ dataUrl: 'data:text/plain;base64,YWI=' })).toBe(2);
  expect(documentBytes({ dataUrl: 'data:text/plain;base64,YWJj' })).toBe(3);
  expect(documentBytes({ dataUrl: 'data:text/plain,%C3%A9' })).toBe(2);
  expect(documentBytes({})).toBe(0);
  expect(documentBytes({ dataUrl: 'invalid' })).toBe(0);
  expect(formatBytes(2048)).toBe('2.0 Ko');
});

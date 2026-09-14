import { describe, expect, it } from 'vitest';
import { ensureProtocol } from './url';

describe('ensureProtocol', () => {
  it('aggiunge https:// ai link senza protocollo', () => {
    expect(ensureProtocol('example.com/manuale.pdf')).toBe('https://example.com/manuale.pdf');
  });

  it('lascia invariati i link http e https', () => {
    expect(ensureProtocol('http://example.com')).toBe('http://example.com');
    expect(ensureProtocol('https://example.com')).toBe('https://example.com');
  });

  it('riconosce il protocollo indipendentemente da maiuscole e spazi', () => {
    expect(ensureProtocol('  HTTPS://Example.com ')).toBe('HTTPS://Example.com');
  });
});

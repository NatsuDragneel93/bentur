import { describe, expect, it } from 'vitest';
import { ensureProtocol, shortUrl } from './url';

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

describe('shortUrl', () => {
  it('mostra dominio e ultimo tratto del percorso', () => {
    expect(shortUrl('https://drive.google.com/file/d/abc/cl5-ref.pdf')).toBe('drive.google.com/…/cl5-ref.pdf');
    expect(shortUrl('https://www.dbaudio.com/v-series')).toBe('dbaudio.com/v-series');
    expect(shortUrl('example.com/')).toBe('example.com');
  });

  it('lascia il testo così com\'è se non è un link valido', () => {
    expect(shortUrl(' non è un link ')).toBe('non è un link');
  });
});

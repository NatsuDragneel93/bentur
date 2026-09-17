// Aggiunge https:// ai link inseriti senza protocollo (es. "example.com/manuale.pdf")
export const ensureProtocol = (link: string): string => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/**
 * Versione breve di un link da mostrare in elenco: dominio e ultimo tratto del percorso,
 * es. "https://drive.google.com/file/d/abc/cl5-ref.pdf" -> "drive.google.com/…/cl5-ref.pdf".
 */
export const shortUrl = (link: string): string => {
  try {
    const url = new URL(ensureProtocol(link));
    const host = url.hostname.replace(/^www\./, '');
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return host;
    if (segments.length === 1) return `${host}/${segments[0]}`;
    return `${host}/…/${segments[segments.length - 1]}`;
  } catch {
    return link.trim();
  }
};

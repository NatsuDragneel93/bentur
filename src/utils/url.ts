// Aggiunge https:// ai link inseriti senza protocollo (es. "example.com/manuale.pdf")
export const ensureProtocol = (link: string): string => {
  const trimmed = link.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

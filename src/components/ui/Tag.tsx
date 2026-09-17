import React from 'react';

interface TagProps {
  tone?: 'accent' | 'neutral' | 'outline';
  className?: string;
  children: React.ReactNode;
}

// Etichetta piccola: ruolo nel tour, avanzamento di una categoria, "da ricomprare"...
const Tag: React.FC<TagProps> = ({ tone = 'neutral', className, children }) => (
  <span className={['tag', `tag-${tone}`, className].filter(Boolean).join(' ')}>{children}</span>
);

export default Tag;

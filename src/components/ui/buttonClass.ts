export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonClassOptions {
  variant?: ButtonVariant;
  block?: boolean;
  danger?: boolean;
  className?: string;
}

// Classi Nocturne di un pulsante: usate anche per i link con aspetto da pulsante
export const buttonClassName = ({ variant = 'secondary', block = false, danger = false, className }: ButtonClassOptions) =>
  ['btn', `btn-${variant}`, block && 'btn-block', danger && 'bt-danger', className].filter(Boolean).join(' ');

import React from 'react';
import './ui.scss';

const withInputClass = (className?: string) => ['input', className].filter(Boolean).join(' ');

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> };

export const Input: React.FC<InputProps> = ({ className, type = 'text', ...props }) => (
  <input type={type} className={withInputClass(className)} {...props} />
);

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => (
  <textarea className={withInputClass(className)} {...props} />
);

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select: React.FC<SelectProps> = ({ className, ...props }) => (
  <select className={withInputClass(className)} {...props} />
);

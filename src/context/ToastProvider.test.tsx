import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider } from './ToastProvider';
import { useToast } from '../hooks/useToast';

const Trigger = () => {
  const { showError, showSuccess } = useToast();
  return (
    <>
      <button onClick={() => showError('Salvataggio fallito')}>errore</button>
      <button onClick={() => showSuccess('Salvato')}>successo</button>
    </>
  );
};

const renderToasts = () => render(<ToastProvider><Trigger /></ToastProvider>);

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('mostra gli errori come alert e i successi come status', () => {
    renderToasts();

    fireEvent.click(screen.getByText('errore'));
    fireEvent.click(screen.getByText('successo'));

    expect(screen.getByRole('alert')).toHaveTextContent('Salvataggio fallito');
    expect(screen.getByRole('status')).toHaveTextContent('Salvato');
  });

  it('nasconde la notifica dopo qualche secondo', () => {
    vi.useFakeTimers();
    renderToasts();

    fireEvent.click(screen.getByText('errore'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('si può chiudere manualmente', () => {
    renderToasts();

    fireEvent.click(screen.getByText('errore'));
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi notifica' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

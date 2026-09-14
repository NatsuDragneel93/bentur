import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('mostra il messaggio e conferma con "Sì"', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open message="Eliminare il tour?" onConfirm={onConfirm} onCancel={vi.fn()} />);

    expect(screen.getByText('Eliminare il tour?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sì' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('annulla con "Annulla"', async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog open message="Eliminare?" onConfirm={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('non conferma due volte mentre l\'eliminazione è in corso', async () => {
    let finish!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<ConfirmDialog open message="Eliminare?" onConfirm={onConfirm} onCancel={vi.fn()} />);

    const confirm = screen.getByRole('button', { name: 'Sì' });
    await userEvent.click(confirm);
    await userEvent.click(confirm);

    expect(confirm).toBeDisabled();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    finish();
  });
});

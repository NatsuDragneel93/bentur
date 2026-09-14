import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormModal from './FormModal';

// Promise risolvibile dall'esterno, per simulare un salvataggio lento
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(res => { resolve = res; });
  return { promise, resolve };
};

const renderModal = (props: Partial<React.ComponentProps<typeof FormModal>> = {}) => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  render(
    <FormModal open title="Aggiungi Manuale" submitLabel="Aggiungi" onSubmit={onSubmit} onClose={onClose} {...props}>
      <label>
        Titolo:
        <input type="text" />
      </label>
    </FormModal>
  );
  return { onSubmit, onClose, ...props };
};

describe('FormModal', () => {
  it('non renderizza nulla se chiusa', () => {
    render(
      <FormModal open={false} title="Titolo" submitLabel="Salva" onSubmit={vi.fn()} onClose={vi.fn()}>
        contenuto
      </FormModal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('mostra titolo e contenuto come dialog accessibile', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Aggiungi Manuale' })).toBeInTheDocument();
    expect(screen.getByLabelText('Titolo:')).toBeInTheDocument();
  });

  it('invia con Enter dentro un campo', async () => {
    const { onSubmit } = renderModal();

    await userEvent.type(screen.getByLabelText('Titolo:'), 'Yamaha{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // Regressione: un doppio clic su "Aggiungi" creava due elementi
  it('ignora gli invii successivi mentre il salvataggio è in corso', async () => {
    const save = deferred();
    const onSubmit = vi.fn(() => save.promise);
    renderModal({ onSubmit });

    const submit = screen.getByRole('button', { name: 'Aggiungi' });
    await userEvent.click(submit);

    const pendingButton = screen.getByRole('button', { name: 'Salvataggio...' });
    expect(pendingButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Annulla' })).toBeDisabled();

    await userEvent.click(pendingButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    save.resolve();
    expect(await screen.findByRole('button', { name: 'Aggiungi' })).toBeEnabled();
  });

  it('si chiude con Annulla, Esc e clic sullo sfondo', async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('dialog').parentElement!);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('non si chiude con un clic dentro la finestra', async () => {
    const { onClose } = renderModal();

    await userEvent.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });
});

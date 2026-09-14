import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Manuals from './Manuals';
import manualsService, { Manual } from '../../services/manuals.service';
import { renderWithAuth } from '../../test/renderWithAuth';

vi.mock('../../services/manuals.service', () => ({
  default: {
    getUserManuals: vi.fn(),
    addManual: vi.fn(),
    updateManual: vi.fn(),
    deleteManual: vi.fn(),
  },
}));

const service = vi.mocked(manualsService);

const manuals = [
  { id: 'm1', userId: 'user-1', title: 'Yamaha CL5', link: 'https://example.com/cl5.pdf' },
  { id: 'm2', userId: 'user-1', title: 'DiGiCo SD12', link: 'https://example.com/sd12.pdf' },
] as Manual[];

describe('Manuals', () => {
  beforeEach(() => {
    service.getUserManuals.mockResolvedValue(manuals);
  });

  it('carica e mostra i manuali dell\'utente', async () => {
    renderWithAuth(<Manuals />);

    expect(await screen.findByText('Yamaha CL5')).toBeInTheDocument();
    expect(screen.getByText('DiGiCo SD12')).toBeInTheDocument();
    expect(service.getUserManuals).toHaveBeenCalledWith('user-1');
  });

  // Regressione: con la ricerca attiva si modificava il manuale sbagliato
  it('con la ricerca attiva modifica il manuale filtrato', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Manuals />);
    await screen.findByText('Yamaha CL5');

    await user.type(screen.getByPlaceholderText('Cerca manuali...'), 'digico');
    await user.click(screen.getByRole('button', { name: /Modifica/ }));

    const titleInput = screen.getByLabelText('Titolo:');
    expect(titleInput).toHaveValue('DiGiCo SD12');
    await user.clear(titleInput);
    await user.type(titleInput, 'DiGiCo SD12 v2');
    await user.click(screen.getByRole('button', { name: 'Salva Modifiche' }));

    expect(service.updateManual).toHaveBeenCalledWith('m2', {
      title: 'DiGiCo SD12 v2',
      link: 'https://example.com/sd12.pdf',
    });
  });

  // Regressione: con la ricerca attiva si eliminava il manuale sbagliato
  it('con la ricerca attiva elimina il manuale filtrato', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Manuals />);
    await screen.findByText('Yamaha CL5');

    await user.type(screen.getByPlaceholderText('Cerca manuali...'), 'digico');
    await user.click(screen.getByRole('button', { name: /Elimina/ }));
    await user.click(screen.getByRole('button', { name: 'Sì' }));

    expect(service.deleteManual).toHaveBeenCalledWith('m2');
  });

  it('mostra una notifica se il caricamento fallisce', async () => {
    service.getUserManuals.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderWithAuth(<Manuals />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Errore nel caricamento dei manuali');
  });

  it('non salva un manuale senza titolo o link', async () => {
    const user = userEvent.setup();
    renderWithAuth(<Manuals />);
    await screen.findByText('Yamaha CL5');

    await user.click(screen.getByRole('button', { name: 'Aggiungi manuale' }));
    await user.type(screen.getByLabelText('Titolo:'), 'Solo titolo');
    await user.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Titolo e link sono obbligatori');
    expect(service.addManual).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsefulContacts from './UsefulContacts';
import usefulContactsService, { Contact } from '../../services/usefulContacts.service';
import { renderWithAuth } from '../../test/renderWithAuth';

vi.mock('../../services/usefulContacts.service', () => ({
  default: {
    getUserContacts: vi.fn(),
    addContact: vi.fn(),
    updateContact: vi.fn(),
    deleteContact: vi.fn(),
  },
}));

const service = vi.mocked(usefulContactsService);

const contacts: Contact[] = [
  { id: 'c1', userId: 'user-1', name: 'Music Store', category: 'Negozio strumenti', phone: '010', email: '', notes: '', city: 'Genova' },
  { id: 'c2', userId: 'user-1', name: 'Audio Service', category: 'Service', phone: '02', email: '', notes: '', city: 'Milano' },
];

describe('UsefulContacts', () => {
  beforeEach(() => {
    service.getUserContacts.mockResolvedValue(contacts);
  });

  // Regressione: con la ricerca attiva si eliminava il contatto sbagliato
  it('con la ricerca attiva elimina il contatto filtrato', async () => {
    const user = userEvent.setup();
    renderWithAuth(<UsefulContacts />);
    await screen.findByText('Music Store');

    await user.type(screen.getByPlaceholderText('Cerca contatti...'), 'audio');
    expect(screen.queryByText('Music Store')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Elimina Audio Service' }));
    await user.click(screen.getByRole('button', { name: 'Sì' }));

    expect(service.deleteContact).toHaveBeenCalledWith('c2');
  });

  it('aggiunge un contatto con i campi compilati', async () => {
    const user = userEvent.setup();
    service.addContact.mockResolvedValue('c3');
    renderWithAuth(<UsefulContacts />);
    await screen.findByText('Music Store');

    await user.click(screen.getByRole('button', { name: 'Aggiungi contatto' }));
    await user.type(screen.getByLabelText('Nome'), 'Riparazioni Rossi');
    await user.selectOptions(screen.getByLabelText('Categoria'), 'Tecnico/riparatore');
    await user.type(screen.getByLabelText('Città'), 'Torino');
    await user.click(screen.getByRole('button', { name: 'Salva' }));

    expect(service.addContact).toHaveBeenCalledWith('user-1', {
      name: 'Riparazioni Rossi',
      category: 'Tecnico/riparatore',
      phone: '',
      email: '',
      notes: '',
      city: 'Torino',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('non salva senza categoria e lo segnala', async () => {
    const user = userEvent.setup();
    renderWithAuth(<UsefulContacts />);
    await screen.findByText('Music Store');

    await user.click(screen.getByRole('button', { name: 'Aggiungi contatto' }));
    await user.type(screen.getByLabelText('Nome'), 'Senza categoria');
    await user.click(screen.getByRole('button', { name: 'Salva' }));

    expect(screen.getByText('La categoria è obbligatoria')).toBeInTheDocument();
    expect(screen.queryByText('Il nome è obbligatorio')).not.toBeInTheDocument();
    expect(service.addContact).not.toHaveBeenCalled();
  });
});

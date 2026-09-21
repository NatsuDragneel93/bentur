import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToDoTour from './ToDoTour';
import { renderWithAuth } from '../../../test/renderWithAuth';
import toursService from '../../../services/tours.service';
import tourArtistsService from '../../../services/tourArtists.service';

vi.mock('../../../services/tours.service', () => ({ default: { getUserTours: vi.fn() } }));
vi.mock('../../../services/tourArtists.service', () => ({
  default: { getTourArtists: vi.fn(), countTourArtists: vi.fn() },
}));

const lists = vi.hoisted(() => {
  const fakeService = () => ({
    getCategories: vi.fn(),
    addCategory: vi.fn(),
    renameCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    updateAllItems: vi.fn(),
    deleteItem: vi.fn(),
    moveItem: vi.fn(),
  });
  return { toDo: fakeService(), spare: fakeService(), consumables: fakeService(), checkBeforeShow: fakeService() };
});

vi.mock('../../../services/artistLists.service', () => ({
  artistToDoService: { forArtist: () => lists.toDo },
  artistSpareService: { forArtist: () => lists.spare },
  artistConsumablesService: { forArtist: () => lists.consumables },
  artistCheckBeforeShowService: { forArtist: () => lists.checkBeforeShow },
}));

const mockedTours = vi.mocked(toursService);
const mockedArtists = vi.mocked(tourArtistsService);

const openTour = async () => userEvent.click(await screen.findByRole('button', { name: /Autumn Tour/ }));

describe('ToDoTour', () => {
  beforeEach(() => {
    mockedTours.getUserTours.mockResolvedValue([{
      id: 't1', name: 'Autumn Tour', ownerId: 'user-1', memberIds: ['user-1'], createdAt: new Date(), updatedAt: new Date(),
    }]);
    mockedArtists.getTourArtists.mockResolvedValue([{
      id: 'a1', tourId: 't1', name: 'Davide Muti', role: 'Batteria', createdAt: new Date(), updatedAt: new Date(),
    }]);
    mockedArtists.countTourArtists.mockResolvedValue(1);
    lists.toDo.getCategories.mockResolvedValue([{
      id: 'c1',
      title: 'Prima del viaggio',
      items: [
        { id: 'i1', order: 0, text: 'Ritirare i piatti', completed: false },
        { id: 'i2', order: 1, text: 'Prenotare il furgone', completed: true },
      ],
    }]);
  });

  it('mostra i to do dell\'artista e l\'avanzamento del tour', async () => {
    renderWithAuth(<ToDoTour />);

    expect(await screen.findByRole('heading', { name: 'To Do - Tour' })).toBeInTheDocument();
    await openTour();

    expect(await screen.findByText('Davide Muti')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prima del viaggio' })).toBeInTheDocument();
    expect(screen.getByText('1 di 2 fatti')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Prima del viaggio' }));
    expect(screen.getByText('Ritirare i piatti')).toBeInTheDocument();
  });

  it('permette di spuntare un to do senza uscire dalla pagina', async () => {
    lists.toDo.updateItem.mockResolvedValue([
      { id: 'i1', order: 0, text: 'Ritirare i piatti', completed: true },
      { id: 'i2', order: 1, text: 'Prenotare il furgone', completed: true },
    ]);
    renderWithAuth(<ToDoTour />);
    await openTour();
    await userEvent.click(await screen.findByRole('button', { name: 'Prima del viaggio' }));

    await userEvent.click(screen.getByRole('checkbox', { name: /Ritirare i piatti/ }));

    expect(lists.toDo.updateItem).toHaveBeenCalledWith('c1', 'i1', { completed: true });
    // Uno sulla categoria, uno sul tour
    await waitFor(() => expect(screen.getAllByText('Tutto fatto')).toHaveLength(2));
  });

  it('permette di aggiungere una categoria all\'artista', async () => {
    lists.toDo.addCategory.mockResolvedValue({ id: 'c2', title: 'Backline', items: [] });
    renderWithAuth(<ToDoTour />);
    await openTour();

    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi categoria' }));
    await userEvent.type(screen.getByLabelText('Nome categoria'), 'Backline{Enter}');

    expect(lists.toDo.addCategory).toHaveBeenCalledWith('Backline');
    expect(await screen.findByRole('button', { name: 'Backline' })).toBeInTheDocument();
  });

  it('non tocca le altre liste dell\'artista', async () => {
    renderWithAuth(<ToDoTour />);
    await openTour();
    await screen.findByText('Davide Muti');

    expect(lists.spare.getCategories).not.toHaveBeenCalled();
    expect(lists.consumables.getCategories).not.toHaveBeenCalled();
    expect(lists.checkBeforeShow.getCategories).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyInventoryTour from './MyInventoryTour';
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

describe('MyInventoryTour', () => {
  beforeEach(() => {
    mockedTours.getUserTours.mockResolvedValue([{
      id: 't1', name: 'Autumn Tour', ownerId: 'user-1', memberIds: ['user-1'], createdAt: new Date(), updatedAt: new Date(),
    }]);
    mockedArtists.getTourArtists.mockResolvedValue([{
      id: 'a1', tourId: 't1', name: 'Davide Muti', role: 'Batteria', createdAt: new Date(), updatedAt: new Date(),
    }]);
    mockedArtists.countTourArtists.mockResolvedValue(1);
    lists.spare.getCategories.mockResolvedValue([{
      id: 's1', title: 'Microfoni', items: [{ id: 'm1', order: 0, name: 'SM58', number: 4 }],
    }]);
    lists.consumables.getCategories.mockResolvedValue([{
      id: 'k1',
      title: 'Borsa',
      items: [
        { id: 'p1', order: 0, name: 'Pile AA', number: 8, toRestock: true },
        { id: 'p2', order: 1, name: 'Nastro', number: 2 },
      ],
    }]);
  });

  it('separa Spare e Consumabili sotto ogni artista', async () => {
    renderWithAuth(<MyInventoryTour />);
    await openTour();

    expect(await screen.findByText('Davide Muti')).toBeInTheDocument();
    const spare = screen.getByRole('heading', { name: 'Spare' }).closest('section')!;
    const consumables = screen.getByRole('heading', { name: 'Consumabili' }).closest('section')!;

    expect(within(spare).getByRole('button', { name: 'Microfoni' })).toBeInTheDocument();
    expect(within(consumables).getByRole('button', { name: 'Borsa' })).toBeInTheDocument();
    expect(within(spare).queryByRole('button', { name: 'Borsa' })).not.toBeInTheDocument();
  });

  it('mostra quanti consumabili sono da ricomprare, per categoria e per tour', async () => {
    renderWithAuth(<MyInventoryTour />);
    await openTour();

    // Uno sulla categoria dei consumabili, uno sul tour (somma di tutti gli artisti)
    await waitFor(() => expect(screen.getAllByText('1 da ricomprare')).toHaveLength(2));
  });

  it('permette di modificare uno spare dell\'artista', async () => {
    lists.spare.updateItem.mockResolvedValue([{ id: 'm1', order: 0, name: 'SM58', number: 6 }]);
    renderWithAuth(<MyInventoryTour />);
    await openTour();
    await userEvent.click(await screen.findByRole('button', { name: 'Microfoni' }));

    await userEvent.click(screen.getByRole('button', { name: 'Modifica Spare' }));
    const quantity = screen.getByLabelText('Numero');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '6');
    await userEvent.click(screen.getByRole('button', { name: 'Salva Modifiche' }));

    expect(lists.spare.updateItem).toHaveBeenCalledWith('s1', 'm1', { name: 'SM58', number: 6 });
    expect(await screen.findByText('SM58 - 6')).toBeInTheDocument();
  });

  it('non tocca to do e controlli pre-spettacolo dell\'artista', async () => {
    renderWithAuth(<MyInventoryTour />);
    await openTour();
    await screen.findByText('Davide Muti');

    expect(lists.toDo.getCategories).not.toHaveBeenCalled();
    expect(lists.checkBeforeShow.getCategories).not.toHaveBeenCalled();
  });
});

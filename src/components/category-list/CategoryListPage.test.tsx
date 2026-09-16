import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryListPage from './CategoryListPage';
import { checklistItemType, consumableItemType, inventoryItemType } from './itemTypes';
import type { CategoryListService, ChecklistItem, ConsumableItem, InventoryItem, ItemCategory } from '../../services/categoryList.service';
import { renderWithAuth } from '../../test/renderWithAuth';

const labels = {
  pageTitle: 'To Do - Personal',
  addItem: 'Aggiungi To Do',
  editItem: 'Modifica To Do',
  deleteItemConfirm: 'Sei sicuro di voler cancellare il to do?',
  emptyCategory: 'Nessun to do presente',
};

const fakeService = <TItem extends ChecklistItem | InventoryItem | ConsumableItem>() => ({
  getCategories: vi.fn(),
  addCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  updateAllItems: vi.fn(),
  deleteItem: vi.fn(),
  moveItem: vi.fn(),
}) satisfies Record<keyof CategoryListService<TItem>, unknown>;

const category = (id: string, title: string, items: ChecklistItem[]): ItemCategory<ChecklistItem> => ({
  id,
  title,
  items,
});

const cables = category('cat-1', 'Cavi', [
  { id: 't1', order: 0, text: 'Comprare XLR', completed: false },
  { id: 't2', order: 1, text: 'Etichettare DI box', completed: true },
]);
const stage = category('cat-2', 'Palco', []);

const renderChecklist = (service: ReturnType<typeof fakeService<ChecklistItem>>) =>
  renderWithAuth(
    <CategoryListPage
      service={service as unknown as CategoryListService<ChecklistItem>}
      itemType={checklistItemType('Già completato')}
      labels={labels}
    />
  );

const openCategory = async (title: string) => {
  await userEvent.click(await screen.findByRole('button', { name: title }));
};

describe('CategoryListPage', () => {
  let service: ReturnType<typeof fakeService<ChecklistItem>>;

  beforeEach(() => {
    service = fakeService<ChecklistItem>();
    service.getCategories.mockResolvedValue([cables, stage]);
  });

  it('carica le categorie dell\'utente e le espande al clic', async () => {
    renderChecklist(service);

    const toggle = await screen.findByRole('button', { name: 'Cavi' });
    expect(service.getCategories).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Comprare XLR')).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Comprare XLR')).toBeInTheDocument();
  });

  it('mostra il messaggio per le categorie vuote', async () => {
    renderChecklist(service);
    await openCategory('Palco');

    expect(screen.getByText('Nessun to do presente')).toBeInTheDocument();
  });

  it('filtra le categorie per nome', async () => {
    renderChecklist(service);
    await screen.findByRole('button', { name: 'Cavi' });

    await userEvent.type(screen.getByLabelText('Cerca categoria...'), 'pal');

    expect(screen.queryByRole('button', { name: 'Cavi' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Palco' })).toBeInTheDocument();
  });

  it('aggiunge una categoria e la apre', async () => {
    service.addCategory.mockResolvedValue(category('cat-3', 'Backline', []));
    renderChecklist(service);
    await screen.findByRole('button', { name: 'Cavi' });

    await userEvent.click(screen.getByRole('button', { name: 'Aggiungi categoria' }));
    await userEvent.type(screen.getByLabelText('Nome categoria:'), 'Backline{Enter}');

    expect(service.addCategory).toHaveBeenCalledWith('Backline');
    expect(await screen.findByRole('button', { name: 'Backline' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('rinomina una categoria', async () => {
    renderChecklist(service);
    await userEvent.click(await screen.findByRole('button', { name: 'Modifica categoria Cavi' }));

    const input = screen.getByLabelText('Nome categoria:');
    await userEvent.clear(input);
    await userEvent.type(input, 'Cavi audio{Enter}');

    expect(service.renameCategory).toHaveBeenCalledWith('cat-1', 'Cavi audio');
    expect(await screen.findByRole('button', { name: 'Cavi audio' })).toBeInTheDocument();
  });

  it('elimina una categoria dopo conferma', async () => {
    renderChecklist(service);
    await userEvent.click(await screen.findByRole('button', { name: 'Elimina categoria Palco' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sì' }));

    expect(service.deleteCategory).toHaveBeenCalledWith('cat-2');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Palco' })).not.toBeInTheDocument());
  });

  it('aggiunge un elemento alla categoria giusta e mostra la lista restituita dal server', async () => {
    service.addItem.mockResolvedValue([
      ...cables.items,
      { id: 't3', order: 2, text: 'Nastro americano', completed: true },
    ]);
    renderChecklist(service);
    await openCategory('Cavi');

    await userEvent.click(screen.getByRole('button', { name: /Aggiungi To Do/ }));
    await userEvent.type(screen.getByLabelText('Testo:'), 'Nastro americano');
    await userEvent.click(screen.getByLabelText('Già completato'));
    await userEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(service.addItem).toHaveBeenCalledWith('cat-1', { text: 'Nastro americano', completed: true });
    expect(await screen.findByText('Nastro americano')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('non aggiunge elementi senza testo', async () => {
    renderChecklist(service);
    await openCategory('Cavi');

    await userEvent.click(screen.getByRole('button', { name: /Aggiungi To Do/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Aggiungi' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Il testo è obbligatorio');
    expect(service.addItem).not.toHaveBeenCalled();
  });

  it('spunta un elemento subito, prima della risposta del server', async () => {
    let resolveUpdate!: (items: ChecklistItem[]) => void;
    service.updateItem.mockReturnValue(new Promise(resolve => { resolveUpdate = resolve; }));
    renderChecklist(service);
    await openCategory('Cavi');

    const checkbox = screen.getByRole('checkbox', { name: /Comprare XLR/ });
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(service.updateItem).toHaveBeenCalledWith('cat-1', 't1', { completed: true });
    resolveUpdate(cables.items.map(i => (i.id === 't1' ? { ...i, completed: true } : i)));
  });

  it('se la modifica fallisce avvisa e ricarica i dati reali', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    service.updateItem.mockRejectedValue(new Error('offline'));
    renderChecklist(service);
    await openCategory('Cavi');

    await userEvent.click(screen.getByRole('checkbox', { name: /Comprare XLR/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Errore nell\'aggiornamento dell\'elemento');
    await waitFor(() => expect(service.getCategories).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('checkbox', { name: /Comprare XLR/ })).not.toBeChecked();
  });

  it('elimina un elemento dopo conferma', async () => {
    service.deleteItem.mockResolvedValue([{ ...cables.items[1], order: 0 }]);
    renderChecklist(service);
    await openCategory('Cavi');

    const row = screen.getByText('Comprare XLR').closest('li')!;
    await userEvent.click(within(row).getByRole('button', { name: 'Elimina' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sì' }));

    expect(service.deleteItem).toHaveBeenCalledWith('cat-1', 't1');
    await waitFor(() => expect(screen.queryByText('Comprare XLR')).not.toBeInTheDocument());
  });

  it('funziona anche con elementi di inventario (nome e quantità)', async () => {
    const inventory = fakeService<InventoryItem>();
    inventory.getCategories.mockResolvedValue([
      { id: 'inv-1', title: 'Microfoni', items: [{ id: 'i1', order: 0, name: 'SM58', number: 4 }] },
    ]);
    inventory.updateItem.mockResolvedValue([{ id: 'i1', order: 0, name: 'SM58', number: 6 }]);

    renderWithAuth(
      <CategoryListPage
        service={inventory as unknown as CategoryListService<InventoryItem>}
        itemType={inventoryItemType}
        labels={{ ...labels, editItem: 'Modifica elemento' }}
      />
    );
    await openCategory('Microfoni');
    expect(screen.getByText('SM58 - 4')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Modifica elemento' }));
    const quantity = screen.getByLabelText('Numero:');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '6');
    await userEvent.click(screen.getByRole('button', { name: 'Salva Modifiche' }));

    expect(inventory.updateItem).toHaveBeenCalledWith('inv-1', 'i1', { name: 'SM58', number: 6 });
    expect(await screen.findByText('SM58 - 6')).toBeInTheDocument();
  });
  describe('azzeramento spunte', () => {
    const resetAction = {
      updates: { completed: false },
      needsReset: (item: ChecklistItem) => item.completed,
      allLabel: 'Azzera tutte le spunte',
      categoryLabel: (title: string) => `Azzera spunte di ${title}`,
      allConfirm: 'Togliere tutte le spunte?',
      categoryConfirm: 'Togliere le spunte della categoria?',
    };
    const done = category('cat-3', 'Monitor', [{ id: 'm1', order: 0, text: 'Check wedge', completed: true }]);

    const renderWithReset = () =>
      renderWithAuth(
        <CategoryListPage
          service={service as unknown as CategoryListService<ChecklistItem>}
          itemType={checklistItemType('Già controllato')}
          labels={labels}
          resetAction={resetAction}
        />
      );

    it('azzera le spunte di una sola categoria dopo conferma', async () => {
      service.updateAllItems.mockResolvedValue(cables.items.map(i => ({ ...i, completed: false })));
      renderWithReset();

      expect(await screen.findByRole('button', { name: 'Azzera spunte di Palco' })).toBeDisabled();
      await userEvent.click(screen.getByRole('button', { name: 'Azzera spunte di Cavi' }));
      expect(screen.getByText('Togliere le spunte della categoria?')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Sì' }));

      expect(service.updateAllItems).toHaveBeenCalledTimes(1);
      expect(service.updateAllItems).toHaveBeenCalledWith('cat-1', { completed: false });
      await openCategory('Cavi');
      expect(screen.getByRole('checkbox', { name: /Etichettare DI box/ })).not.toBeChecked();
    });

    it('azzera tutte le categorie con elementi spuntati', async () => {
      service.getCategories.mockResolvedValue([cables, stage, done]);
      service.updateAllItems.mockImplementation(async (categoryId: string) =>
        (categoryId === 'cat-1' ? cables.items : done.items).map(i => ({ ...i, completed: false }))
      );
      renderWithReset();

      await userEvent.click(await screen.findByRole('button', { name: /Azzera tutte le spunte/ }));
      await userEvent.click(screen.getByRole('button', { name: 'Sì' }));

      await waitFor(() => expect(service.updateAllItems).toHaveBeenCalledTimes(2));
      expect(service.updateAllItems).toHaveBeenCalledWith('cat-1', { completed: false });
      expect(service.updateAllItems).toHaveBeenCalledWith('cat-3', { completed: false });
      expect(screen.getByRole('button', { name: /Azzera tutte le spunte/ })).toBeDisabled();
    });
  });

  it('mostra il pulsante indietro e il sottotitolo', async () => {
    const onBack = vi.fn();
    renderWithAuth(
      <CategoryListPage
        service={service as unknown as CategoryListService<ChecklistItem>}
        itemType={checklistItemType('Già completato')}
        labels={labels}
        subtitle="Anna"
        back={{ label: 'Torna all\'artista', onClick: onBack }}
      />
    );

    expect(await screen.findByText('Anna')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Torna all'artista/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('consumabili: segna "da ricomprare" dalla lista e lo mostra nel badge della categoria', async () => {
    const consumables = fakeService<ConsumableItem>();
    const bag = { id: 'bag', title: 'Borsa', items: [{ id: 'c1', order: 0, name: 'Pile AA', number: 8 }] };
    consumables.getCategories.mockResolvedValue([bag]);
    consumables.updateItem.mockResolvedValue([{ ...bag.items[0], toRestock: true }]);

    renderWithAuth(
      <CategoryListPage
        service={consumables as unknown as CategoryListService<ConsumableItem>}
        itemType={consumableItemType}
        labels={labels}
        categoryBadge={items => {
          const count = items.filter(i => i.toRestock).length;
          return count > 0 ? `${count} da ricomprare` : null;
        }}
      />
    );
    await openCategory('Borsa');

    await userEvent.click(screen.getByRole('button', { name: 'Segna "Pile AA" da ricomprare' }));

    expect(consumables.updateItem).toHaveBeenCalledWith('bag', 'c1', { toRestock: true });
    expect(await screen.findByRole('button', { name: 'Segna "Pile AA" come disponibile' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 da ricomprare')).toBeInTheDocument();
  });
});

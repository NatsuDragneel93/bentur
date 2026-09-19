import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Timestamp } from 'firebase/firestore';
import SetupEditor from './SetupEditor';
import { renderWithAuth } from '../../../test/renderWithAuth';
import tourArtistsService from '../../../services/tourArtists.service';
import artistSetupsService, { StageSetup } from '../../../services/artistSetups.service';
import { createElement } from '../../../utils/stagePlot';
import { GESTURE_HELP_STORAGE_KEY } from './gestureHelpStorage';

vi.mock('../../../services/tourArtists.service', () => ({
  default: { getTourArtistById: vi.fn() },
}));

vi.mock('../../../services/artistSetups.service', () => ({
  default: { getSetup: vi.fn(), saveSetup: vi.fn() },
}));

// jsdom non ha il canvas: Konva non viene caricato e le forme diventano semplici elementi HTML
vi.mock('konva', () => ({ default: {} }));
vi.mock('react-konva', () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    Stage: passthrough,
    Layer: passthrough,
    // Konva passa l'evento del browser dentro `evt` ed emette un tocco (onTap) quando il dito si alza
    Group: ({ children, id, onMouseDown, onTap, onTouchStart, onTouchEnd }: {
      children?: React.ReactNode;
      id: string;
      onMouseDown: (e: { evt: React.MouseEvent }) => void;
      onTap: (e: { evt: React.TouchEvent }) => void;
      onTouchStart: () => void;
      onTouchEnd: () => void;
    }) => (
      <div
        data-testid="stage-element"
        data-id={id}
        onClick={e => onMouseDown({ evt: e })}
        onTouchStart={onTouchStart}
        onTouchEnd={e => {
          onTouchEnd();
          onTap({ evt: e });
        }}
      >
        {children}
      </div>
    ),
    Rect: ({ fill, name }: { fill?: string; name?: string }) => (name ? null : <i data-testid="shape-fill" data-fill={fill} />),
    Ellipse: ({ fill }: { fill?: string }) => <i data-testid="shape-fill" data-fill={fill} />,
    Line: () => null,
    Star: ({ fill }: { fill?: string }) => <i data-testid="shape-fill" data-fill={fill} />,
    Shape: () => null,
    Text: ({ text }: { text: string }) => <span>{text}</span>,
    Transformer: () => null,
  };
});

const mockedSetups = vi.mocked(artistSetupsService);
const timestamp = (millis: number) => ({ toMillis: () => millis }) as unknown as Timestamp;
const setup = (elements: StageSetup['elements'], millis: number | null = 1000): StageSetup => ({
  elements,
  updatedAt: millis === null ? null : timestamp(millis),
  updatedBy: millis === null ? null : { uid: 'user-1', name: 'Mario Rossi' },
});

const drums = createElement('rect', 'drums', { x: 500, y: 300 }, 'Kit principale');
const cymbal = createElement('circle', 'cymbal', { x: 400, y: 250 }, 'Piatto');

const renderEditor = (setupKey = 'a') =>
  renderWithAuth(<SetupEditor />, {
    route: `/tours/t1/artists/a1/setup/${setupKey}`,
    path: '/tours/:tourId/artists/:artistId/setup/:setupKey',
    extraRoutes: { '/tours/:tourId/artists/:artistId': <div>Dettaglio artista</div> },
  });

const shapes = () => screen.queryAllByTestId('stage-element');

describe('SetupEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(tourArtistsService).getTourArtistById.mockResolvedValue({
      id: 'a1', tourId: 't1', name: 'Anna', role: 'Voce', createdAt: new Date(), updatedAt: new Date(),
    });
    mockedSetups.getSetup.mockResolvedValue(setup([drums]));
  });

  it('carica il setup salvato dell\'artista', async () => {
    renderEditor('b');

    expect(await screen.findByText('Kit principale')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Setup B' })).toBeInTheDocument();
    expect(mockedSetups.getSetup).toHaveBeenCalledWith('t1', 'a1', 'b');
    expect(screen.getByText('Tutto salvato')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salva/ })).toBeDisabled();
  });

  it('personalizza una forma e salva le modifiche', async () => {
    mockedSetups.saveSetup.mockImplementation(async (_t, _a, _k, elements) => ({
      status: 'saved',
      setup: { elements, updatedAt: timestamp(2000), updatedBy: { uid: 'user-1', name: 'Mario Rossi' } },
    }));
    renderEditor();

    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Cerchio' }));
    expect(screen.getByText('Modifiche non salvate')).toBeInTheDocument();

    // La nuova forma è selezionata: il pannello proprietà è aperto
    await userEvent.type(screen.getByLabelText('Nome'), 'Piatto');
    await userEvent.click(screen.getByRole('button', { name: 'Colore forma: #5d5294' }));

    const circle = shapes()[1];
    expect(within(circle).getByText('Piatto')).toBeInTheDocument();
    expect(within(circle).getByTestId('shape-fill')).toHaveAttribute('data-fill', '#5d5294');

    await userEvent.click(screen.getByRole('button', { name: /Salva/ }));

    expect(mockedSetups.saveSetup).toHaveBeenCalledWith(
      't1', 'a1', 'a',
      [drums, expect.objectContaining({ type: 'circle', label: 'Piatto', fill: '#5d5294' })],
      expect.objectContaining({ user: { uid: 'user-1', name: 'Mario Rossi' }, force: false })
    );
    expect(mockedSetups.saveSetup.mock.calls[0][4].baseUpdatedAt?.toMillis()).toBe(1000);
    expect(await screen.findByText('Setup salvato')).toBeInTheDocument();
    expect(screen.getByText('Tutto salvato')).toBeInTheDocument();
  });

  it('annulla e ripristina; il nome scritto di seguito si annulla in un solo passo', async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Quadrato' }));
    await userEvent.type(screen.getByLabelText('Nome'), 'Ampli');
    expect(screen.getByText('Ampli')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(screen.queryByText('Ampli')).not.toBeInTheDocument();
    expect(shapes()).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(shapes()).toHaveLength(1);
    expect(screen.getByText('Tutto salvato')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ripristina' }));
    expect(shapes()).toHaveLength(2);
  });

  it('duplica, riordina ed elimina la forma selezionata', async () => {
    mockedSetups.getSetup.mockResolvedValue(setup([drums, cymbal]));
    renderEditor();

    await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
    expect(screen.getByRole('button', { name: 'Porta indietro' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Porta avanti' }));
    expect(shapes().map(s => s.dataset.id)).toEqual(['cymbal', 'drums']);

    await userEvent.click(screen.getByRole('button', { name: 'Duplica' }));
    expect(shapes()).toHaveLength(3);
    expect(screen.getAllByText('Kit principale')).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    expect(shapes()).toHaveLength(2);
    expect(screen.getByText('Seleziona una forma per cambiarne nome e colori')).toBeInTheDocument();
  });

  describe('selezione multipla', () => {
    // Ctrl+clic: userEvent non passa i modificatori al clic, serve l'evento diretto
    const ctrlClick = (element: HTMLElement) => fireEvent.click(element, { ctrlKey: true });
    // Più della pressione prolungata di StageCanvas (500 ms)
    const LONG_PRESS_WAIT = 1000;

    it('con Ctrl+clic seleziona più forme e le elimina insieme', async () => {
      mockedSetups.getSetup.mockResolvedValue(setup([drums, cymbal]));
      renderEditor();

      await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
      ctrlClick(shapes()[1]);

      // Su PC conteggio e azioni di gruppo stanno nel pannello a destra
      expect(screen.getByRole('heading', { name: '2 forme selezionate' })).toBeInTheDocument();
      // Nome e colori restano per la forma singola
      expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Elimina' }));

      expect(shapes()).toHaveLength(0);
      expect(screen.getByText('Modifiche non salvate')).toBeInTheDocument();
    });

    it('duplica tutte le forme selezionate', async () => {
      mockedSetups.getSetup.mockResolvedValue(setup([drums, cymbal]));
      renderEditor();

      await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
      ctrlClick(shapes()[1]);
      await userEvent.click(screen.getByRole('button', { name: 'Duplica' }));

      expect(shapes()).toHaveLength(4);
      expect(screen.getAllByText('Kit principale')).toHaveLength(2);
      expect(screen.getAllByText('Piatto')).toHaveLength(2);
      // Restano selezionate le copie
      expect(screen.getByRole('heading', { name: '2 forme selezionate' })).toBeInTheDocument();
    });

    it('Ctrl+clic su una forma già selezionata la toglie dalla selezione', async () => {
      mockedSetups.getSetup.mockResolvedValue(setup([drums, cymbal]));
      renderEditor();

      await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
      ctrlClick(shapes()[1]);
      ctrlClick(shapes()[1]);

      expect(screen.queryByText(/forme selezionate/)).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Proprietà forma' })).toBeInTheDocument();
    });

    it('la pressione prolungata su una forma avvia la multiselezione', async () => {
      mockedSetups.getSetup.mockResolvedValue(setup([drums, cymbal]));
      renderEditor();

      const shape = (await screen.findAllByTestId('stage-element'))[0];
      fireEvent.touchStart(shape);

      // La barra compare allo scadere della pressione prolungata
      expect(await screen.findByText('1 forma selezionata')).toBeInTheDocument();

      // Alzando il dito Konva emette anche un tocco: la forma resta selezionata
      fireEvent.touchEnd(shape);
      expect(screen.getByText('1 forma selezionata')).toBeInTheDocument();
      const bar = screen.getByRole('toolbar', { name: 'Selezione multipla' });

      // In multiselezione basta toccare le altre forme
      await userEvent.click(shapes()[1]);
      expect(within(bar).getByText('2 forme selezionate')).toBeInTheDocument();

      await userEvent.click(within(bar).getByRole('button', { name: 'Esci' }));
      expect(screen.queryByRole('toolbar', { name: 'Selezione multipla' })).not.toBeInTheDocument();
      expect(screen.getByText('Seleziona una forma per cambiarne nome e colori')).toBeInTheDocument();
    });

    it('la pressione interrotta subito non avvia la multiselezione', async () => {
      mockedSetups.getSetup.mockResolvedValue(setup([drums, cymbal]));
      renderEditor();

      const shape = (await screen.findAllByTestId('stage-element'))[0];

      vi.useFakeTimers();
      try {
        fireEvent.touchStart(shape);
        fireEvent.touchEnd(shape);
        // Anche lasciando passare il tempo della pressione prolungata la modalità non parte
        act(() => vi.advanceTimersByTime(LONG_PRESS_WAIT));
      } finally {
        vi.useRealTimers();
      }

      expect(screen.queryByRole('toolbar', { name: 'Selezione multipla' })).not.toBeInTheDocument();
    });
  });

  it('aggiunge una stella', async () => {
    renderEditor();

    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Stella' }));

    const star = shapes()[1];
    expect(within(star).getByTestId('shape-fill')).toHaveAttribute('data-fill', '#968ae0');
    expect(screen.getByRole('heading', { name: 'Proprietà forma' })).toBeInTheDocument();
  });

  describe('salvataggio in conflitto', () => {
    const remote: StageSetup = { elements: [cymbal], updatedAt: timestamp(3000), updatedBy: { uid: 'user-2', name: 'Luca' } };

    const saveWithConflict = async () => {
      mockedSetups.saveSetup.mockResolvedValueOnce({ status: 'conflict', remote });
      renderEditor();
      await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Triangolo' }));
      await userEvent.click(screen.getByRole('button', { name: /Salva/ }));
      expect(await screen.findByText(/Luca ha salvato questo setup/)).toBeInTheDocument();
    };

    it('può caricare la versione dell\'altro utente', async () => {
      await saveWithConflict();

      await userEvent.click(screen.getByRole('button', { name: 'Carica la sua versione' }));

      expect(shapes().map(s => s.dataset.id)).toEqual(['cymbal']);
      expect(screen.getByText('Tutto salvato')).toBeInTheDocument();
    });

    it('può sovrascrivere con la propria versione', async () => {
      await saveWithConflict();
      mockedSetups.saveSetup.mockImplementationOnce(async (_t, _a, _k, elements) => ({
        status: 'saved',
        setup: { elements, updatedAt: timestamp(4000), updatedBy: { uid: 'user-1', name: 'Mario Rossi' } },
      }));

      await userEvent.click(screen.getByRole('button', { name: 'Sovrascrivi con la mia' }));

      expect(mockedSetups.saveSetup).toHaveBeenLastCalledWith('t1', 'a1', 'a', expect.any(Array), expect.objectContaining({ force: true }));
      await waitFor(() => expect(screen.queryByText(/Luca ha salvato/)).not.toBeInTheDocument());
      expect(shapes()).toHaveLength(2);
    });
  });

  it('Setup B vuoto: propone di copiare il Setup A', async () => {
    mockedSetups.getSetup.mockImplementation(async (_t, _a, key) => (key === 'a' ? setup([drums, cymbal]) : setup([], null)));
    renderEditor('b');

    await userEvent.click(await screen.findByRole('button', { name: 'Copia Setup A' }));

    expect(screen.getByText('Kit principale')).toBeInTheDocument();
    expect(screen.getByText('Piatto')).toBeInTheDocument();
    // Le forme copiate hanno id nuovi e vanno salvate
    expect(shapes().map(s => s.dataset.id)).not.toContain('drums');
    expect(screen.getByText('Modifiche non salvate')).toBeInTheDocument();
  });

  it('Setup B vuoto con Setup A vuoto: nessuna proposta', async () => {
    mockedSetups.getSetup.mockResolvedValue(setup([], null));
    renderEditor('b');

    await screen.findByRole('toolbar');
    await waitFor(() => expect(mockedSetups.getSetup).toHaveBeenCalledWith('t1', 'a1', 'a'));
    expect(screen.queryByRole('button', { name: 'Copia Setup A' })).not.toBeInTheDocument();
  });

  it('chiede conferma prima di uscire con modifiche non salvate', async () => {
    renderEditor();
    await userEvent.click(await screen.findByRole('button', { name: 'Aggiungi Linea' }));

    await userEvent.click(screen.getByRole('button', { name: 'Anna' }));
    await userEvent.click(screen.getByRole('button', { name: 'Esci senza salvare' }));

    expect(await screen.findByText('Dettaglio artista')).toBeInTheDocument();
  });

  it('senza modifiche torna subito all\'artista', async () => {
    renderEditor();
    await screen.findByText('Kit principale');

    await userEvent.click(screen.getByRole('button', { name: 'Anna' }));

    expect(await screen.findByText('Dettaglio artista')).toBeInTheDocument();
  });

  it('con un setup inesistente torna al dettaglio dell\'artista', async () => {
    renderEditor('c');

    expect(await screen.findByText('Dettaglio artista')).toBeInTheDocument();
  });

  it('mostra "non trovato" se l\'artista non è accessibile', async () => {
    vi.mocked(tourArtistsService).getTourArtistById.mockResolvedValue(null);
    renderEditor();

    expect(await screen.findByText('Artista non trovato')).toBeInTheDocument();
    expect(mockedSetups.getSetup).not.toHaveBeenCalled();
  });

  describe('aiuto sui gesti', () => {
    it('si apre al primo accesso e, una volta chiuso, non si riapre da solo', async () => {
      const { unmount } = renderEditor();

      expect(await screen.findByRole('region', { name: 'Come si usa' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: "Chiudi l'aiuto" }));
      expect(screen.queryByRole('region', { name: 'Come si usa' })).not.toBeInTheDocument();
      expect(localStorage.getItem(GESTURE_HELP_STORAGE_KEY)).toBe('1');

      unmount();
      renderEditor();
      await screen.findByText('Kit principale');
      expect(screen.queryByRole('region', { name: 'Come si usa' })).not.toBeInTheDocument();
    });

    it('si riapre con il pulsante "?"', async () => {
      localStorage.setItem(GESTURE_HELP_STORAGE_KEY, '1');
      renderEditor();

      await userEvent.click(await screen.findByRole('button', { name: 'Come si usa' }));

      expect(screen.getByRole('region', { name: 'Come si usa' })).toBeInTheDocument();
      expect(screen.getByText('Trascina una forma per spostarla')).toBeInTheDocument();
    });
  });

  describe('su cellulare', () => {
    beforeEach(() => {
      localStorage.setItem(GESTURE_HELP_STORAGE_KEY, '1');
      vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
        // Un telefono rientra sia nel layout cellulare sia in quello compatto
        matches: query === '(max-width: 768px)' || query === '(max-width: 1023px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('selezionare o aggiungere una forma non apre il pannello: si apre con "Modifica"', async () => {
      renderEditor();

      await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
      expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();
      expect(screen.getByRole('toolbar', { name: 'Forme' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Aggiungi Cerchio' }));
      expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Modifica' }));

      // Il pannello si apre in primo piano sopra il palco
      const sheet = screen.getByRole('dialog', { name: 'Proprietà forma' });
      expect(within(sheet).getByLabelText('Nome')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Modifica' })).not.toBeInTheDocument();
    });

    it('"Fatto" chiude il pannello e lascia la forma selezionata', async () => {
      renderEditor();
      await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
      await userEvent.click(screen.getByRole('button', { name: 'Modifica' }));

      await userEvent.click(screen.getByRole('button', { name: 'Fatto' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Modifica' })).toBeInTheDocument();
    });

    it('toccando fuori dal pannello lo chiude e le modifiche restano', async () => {
      renderEditor();
      await userEvent.click((await screen.findAllByTestId('stage-element'))[0]);
      await userEvent.click(screen.getByRole('button', { name: 'Modifica' }));
      await userEvent.clear(screen.getByLabelText('Nome'));
      await userEvent.type(screen.getByLabelText('Nome'), 'Drum kit');

      await userEvent.click(screen.getByRole('dialog').parentElement!);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Drum kit')).toBeInTheDocument();
    });

    it('mostra i suggerimenti per il touch', async () => {
      localStorage.clear();
      renderEditor();

      expect(await screen.findByText('Con due dita ingrandisci e sposti il palco')).toBeInTheDocument();
    });
  });
});

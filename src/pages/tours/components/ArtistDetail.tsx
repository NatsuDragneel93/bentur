import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  faCircleCheck,
  faLayerGroup,
  faListCheck,
  faSliders,
  faWrench,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import LoadingState from '../../../components/ui/LoadingState';
import { NavCard } from '../../../components/ui/Card';
import { Page, TopBar } from '../../../components/ui/PageLayout';
import type { ArtistListKey } from '../../../services/tours.service';
import { artistListPath } from '../artist-lists/artistListPaths';
import { artistSetupPath, SetupKey } from '../setup/setupPaths';
import { useTourArtist } from '../useTourArtist';
import './ArtistDetail.scss';

type SectionKey = 'setupA' | 'setupB' | ArtistListKey;

const setupSection = (setupKey: SetupKey) => (tourId: string, artistId: string) => artistSetupPath(tourId, artistId, setupKey);
const listSection = (listKey: ArtistListKey) => (tourId: string, artistId: string) => artistListPath(tourId, artistId, listKey);

// Una famiglia di card uguali, distinte solo dall'icona; path = pagina aperta dalla card
const SECTIONS: { key: SectionKey; icon: IconDefinition; path: (tourId: string, artistId: string) => string }[] = [
  { key: 'setupA', icon: faSliders, path: setupSection('a') },
  { key: 'setupB', icon: faSliders, path: setupSection('b') },
  { key: 'spare', icon: faWrench, path: listSection('spare') },
  { key: 'toDo', icon: faListCheck, path: listSection('toDo') },
  { key: 'consumables', icon: faLayerGroup, path: listSection('consumables') },
  { key: 'checkBeforeShow', icon: faCircleCheck, path: listSection('checkBeforeShow') },
];

interface ArtistDetailProps {
  tourId: string;
  artistId: string;
  onBack: () => void;
}

const ArtistDetail: React.FC<ArtistDetailProps> = ({ tourId, artistId, onBack }) => {
  const { artist, loading } = useTourArtist(tourId, artistId);
  const { t } = useTranslation();
  // Il nome del tour non è caricato qui: etichetta fissa
  const back = { label: t('nav.tours'), onClick: onBack };

  if (loading || !artist) {
    return (
      <Page>
        <TopBar back={back} />
        {loading ? <LoadingState /> : <p className="bt-empty">{t('artistDetail.notFound')}</p>}
      </Page>
    );
  }

  return (
    <Page className="artist-detail">
      <TopBar back={back} />

      <div className="bt-kicker">{artist.role}</div>
      <h1 className="bt-page-title artist-detail__title">{artist.name}</h1>

      <nav className="bt-grid" aria-label={artist.name}>
        {SECTIONS.map(section => (
          <NavCard
            key={section.key}
            to={section.path(tourId, artistId)}
            icon={section.icon}
            title={t(`artistDetail.sections.${section.key}.title`)}
            description={t(`artistDetail.sections.${section.key}.description`)}
          />
        ))}
      </nav>
    </Page>
  );
};

export default ArtistDetail;

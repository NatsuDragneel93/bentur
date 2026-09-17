import React from 'react';
import { useTranslation } from 'react-i18next';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import IconButton from '../../../components/ui/IconButton';

interface GestureHelpProps {
  // Cellulare: palette in basso e gesti touch
  mobile: boolean;
  // Tablet e cellulare: nome e colori in un pannello aperto con "Modifica"
  compact: boolean;
  onClose: () => void;
}

// Spiegazione rapida di come si usa l'editor, diversa tra touch e mouse
const GestureHelp: React.FC<GestureHelpProps> = ({ mobile, compact, onClose }) => {
  const { t } = useTranslation();
  const tips = [
    t(mobile ? 'setupEditor.help.addTouch' : 'setupEditor.help.addMouse'),
    t(mobile ? 'setupEditor.help.moveTouch' : 'setupEditor.help.moveMouse'),
    t('setupEditor.help.resize'),
    t(compact ? 'setupEditor.help.editTouch' : 'setupEditor.help.editMouse'),
    t(mobile ? 'setupEditor.help.zoomTouch' : 'setupEditor.help.zoomMouse'),
  ];

  return (
    <section className="se-help" aria-label={t('setupEditor.help.title')}>
      <div className="se-help-header">
        <h2>{t('setupEditor.help.title')}</h2>
        <IconButton icon={faXmark} variant="ghost" onClick={onClose} label={t('setupEditor.help.close')} />
      </div>
      <ul>
        {tips.map(tip => <li key={tip}>{tip}</li>)}
      </ul>
    </section>
  );
};

export default GestureHelp;

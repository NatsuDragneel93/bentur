import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

interface GestureHelpProps {
  mobile: boolean;
  onClose: () => void;
}

// Spiegazione rapida di come si usa l'editor, diversa tra touch e mouse
const GestureHelp: React.FC<GestureHelpProps> = ({ mobile, onClose }) => {
  const { t } = useTranslation();
  const tips = mobile
    ? [
        t('setupEditor.help.addTouch'),
        t('setupEditor.help.moveTouch'),
        t('setupEditor.help.resize'),
        t('setupEditor.help.editTouch'),
        t('setupEditor.help.zoomTouch'),
      ]
    : [
        t('setupEditor.help.addMouse'),
        t('setupEditor.help.moveMouse'),
        t('setupEditor.help.resize'),
        t('setupEditor.help.editMouse'),
        t('setupEditor.help.zoomMouse'),
      ];

  return (
    <section className="se-help" aria-label={t('setupEditor.help.title')}>
      <div className="se-help-header">
        <h2>{t('setupEditor.help.title')}</h2>
        <button type="button" className="se-icon-button" onClick={onClose} aria-label={t('setupEditor.help.close')}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <ul>
        {tips.map(tip => <li key={tip}>{tip}</li>)}
      </ul>
    </section>
  );
};

export default GestureHelp;

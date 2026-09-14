import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import './ui/ui.scss';

// Selettore IT/EN. La scelta viene salvata sul dispositivo dal language detector.
const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage;

  return (
    <div className="bt-language" role="group" aria-label={t('language.label')}>
      {SUPPORTED_LANGUAGES.map(language => (
        <button
          key={language}
          type="button"
          className={`bt-language__option ${current === language ? 'bt-language__option--active' : ''}`}
          aria-pressed={current === language}
          title={t(`language.${language}`)}
          onClick={() => i18n.changeLanguage(language)}
        >
          {language.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;

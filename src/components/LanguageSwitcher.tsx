import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n';
import Segmented from './ui/Segmented';

// Selettore IT/EN. La scelta viene salvata sul dispositivo dal language detector.
const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? 'it') as SupportedLanguage;

  return (
    <Segmented
      className={className}
      ariaLabel={t('language.label')}
      value={current}
      onChange={language => i18n.changeLanguage(language)}
      options={SUPPORTED_LANGUAGES.map(language => ({
        value: language,
        label: language.toUpperCase(),
        title: t(`language.${language}`),
      }))}
    />
  );
};

export default LanguageSwitcher;

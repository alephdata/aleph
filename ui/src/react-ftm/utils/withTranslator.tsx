import React from 'react';
import { IntlProvider } from 'react-intl';
import translations from 'react-ftm/translations/translations.json';

export function withTranslator<T>(WrappedComponent: React.ComponentType<T>) {
  return class extends React.Component<any> {
    render() {
      const { locale, ...rest } = this.props;

      //  override arabic locale to marocan version
      // We want all dates and numbers in latin instead of default ar eastern digits
      const modifiedLocale = locale === 'ar' ? 'ar-ma' : locale;

      return (
        <IntlProvider
          locale={modifiedLocale || 'en'}
          key={locale || 'en'}
          messages={translations[locale || 'en']}
        >
          <WrappedComponent {...(rest as T)} />
        </IntlProvider>
      );
    }
  };
}

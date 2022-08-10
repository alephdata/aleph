import React from 'react';
import { IntlProvider } from 'react-intl';
import translations from 'react-ftm/translations/translations.json';

type Locale = keyof typeof translations;

export function withTranslator<T>(WrappedComponent: React.ComponentType<T>) {
  return class extends React.Component<any> {
    render() {
      const { locale, ...rest } = this.props;

      const normalized: Locale = locale in translations ? locale : 'en';

      // Override arabic locale to marocan version
      // We want all dates and numbers in latin instead of default ar eastern digits
      const modified = normalized === 'ar' ? 'ar-ma' : normalized;

      return (
        <IntlProvider
          locale={modified}
          key={locale || 'en'}
          messages={translations[normalized]}
        >
          <WrappedComponent {...(rest as T)} />
        </IntlProvider>
      );
    }
  };
}

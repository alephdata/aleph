import React from 'react';
import { connect } from 'react-redux';

import { IntlProvider } from 'react-intl';
// import en from 'react-intl/locale-data/en';
// import de from 'react-intl/locale-data/de';
// import bs from 'react-intl/locale-data/bs';
// import ru from 'react-intl/locale-data/ru';
// import es from 'react-intl/locale-data/es';
// import ar from 'react-intl/locale-data/ar';

import { selectLocale } from 'selectors';
import translations from 'content/translations.json';

// add locale data to react-intl
// addLocaleData([...en, ...de, ...bs, ...es, ...ru, ...ar]);

class Translator extends React.PureComponent {
  render() {
    const { locale, children } = this.props;
    return (
      <IntlProvider key={locale} locale={locale} messages={translations[locale]}>
        {children}
      </IntlProvider>
    );
  }
}

const mapStateToProp = state => ({ locale: selectLocale(state) });
export default connect(mapStateToProp)(Translator);

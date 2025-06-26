import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';

import { selectLocale } from '/src/selectors';
import translations from '/src/content/translations.json';

class Translator extends React.Component {
  render() {
    const { children, locale } = this.props;

    //  override arabic locale to marocan version
    // We want all dates and numbers in latin instead of default ar eastern digits
    const modifiedLocale = locale === 'ar' ? 'ar-ma' : locale;

    return (
      <IntlProvider
        key={locale}
        locale={modifiedLocale || 'en'}
        messages={translations[locale]}
      >
        {children}
      </IntlProvider>
    );
  }
}

const mapStateToProp = (state) => ({ locale: selectLocale(state) });
export default connect(mapStateToProp)(Translator);

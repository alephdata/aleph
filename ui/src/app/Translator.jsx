import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { shouldPolyfill } from '@formatjs/intl-relativetimeformat/should-polyfill'
import { Spinner } from '@blueprintjs/core';

import { selectLocale } from 'selectors';
import translations from 'content/translations.json';
import { selectLocale } from 'selectors';


class Translator extends React.Component {
  constructor(props) {
    super(props);
    this.requiresPollyfill = shouldPolyfill();
    this.state = { isPending: this.requiresPollyfill };
  }

  componentDidMount() {
    if (this.requiresPollyfill) {
      this.fetchPolyfill();
    }
  }

  componentDidUpdate(prevProps) {
    if (this.requiresPolyfill && prevProps.locale !== this.props.locale) {
      this.fetchLocale()
    }
  }

  fetchPolyfill = async () => {
    await import('@formatjs/intl-locale/polyfill')
    await import('@formatjs/intl-pluralrules/polyfill');
    await import('@formatjs/intl-relativetimeformat/polyfill');
    this.fetchLocale();
  }

  fetchLocale = async () => {
    const { locale } = this.props;
    await import(`@formatjs/intl-pluralrules/locale-data/${locale}`)
    await import(`@formatjs/intl-relativetimeformat/locale-data/${locale}`)
    this.setState({ isPending: false });
  }

  render() {
    const { children, locale } = this.props;
    const { isPending } = this.state;

    if (isPending) {
      return <div className="spinner"><Spinner className="bp3-large" /></div>
    }

    //  override arabic locale to marocan version 
    // We want all dates and numbers in latin instead of default ar eastern digits 
    const modifiedLocale = locale === "ar" ? "ar-ma" : locale;

    return (
      <IntlProvider key={locale} locale={modifiedLocale || "en"} messages={translations[locale]}>
        {children}
      </IntlProvider>
    );
  }
}

const mapStateToProp = state => ({ locale: selectLocale(state) });
export default connect(mapStateToProp)(Translator);

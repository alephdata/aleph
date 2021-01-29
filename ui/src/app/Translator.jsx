import React from 'react';
import { connect } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { shouldPolyfill } from '@formatjs/intl-relativetimeformat/should-polyfill'

import { selectLocale } from 'selectors';
import { SectionLoading } from 'components/common';
import translations from 'content/translations.json';


class Translator extends React.Component {
  constructor(props) {
    super(props);
    this.requiresPolyfill = shouldPolyfill();
    this.state = { isPending: this.requiresPolyfill };
  }

  componentDidMount() {
    if (this.requiresPolyfill) {
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
      return <SectionLoading className="bp3-large" />
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

import React from 'react';
import { connect } from 'react-redux'

import { addLocaleData, IntlProvider } from 'react-intl';
import en from 'react-intl/locale-data/en';
import de from 'react-intl/locale-data/de';
import bs from 'react-intl/locale-data/bs';
import ru from 'react-intl/locale-data/ru';
import es from 'react-intl/locale-data/es';
import ar from 'react-intl/locale-data/ar';

import { selectLocale } from 'src/selectors';
import translations from 'src/content/translations.json';

// add locale data to react-intl
addLocaleData([...en, ...de, ...bs, ...es, ...ru, ...ar]);

class Translator extends React.PureComponent {
    render(){
        const { locale, children } = this.props;
        return  <IntlProvider locale={this.props.locale} key={this.props.locale} messages={translations[locale]}>
            {children}
        </IntlProvider>
    }
}

const mapStateToProp = (state) =>  ({ locale: selectLocale(state) });
export default connect(mapStateToProp)(Translator);


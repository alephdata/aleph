import { FormattedNumber, FormattedMessage } from 'react-intl';

import wordList from 'src/util/wordList';
import React, { Component } from 'react';
import { connect } from 'react-redux';


class Name extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.code !== nextProps.code;
  }

  render() {
    const { code, countries } = this.props,
          codeLabel = code ? code.toUpperCase() : <FormattedMessage id="country.unknown" defaultMessage="Unknown"/>,
          label = countries[code] || codeLabel;
    
    if (!code) return null;
    return (
      <span>{ label }</span>
    );
  }
}

class List extends Component {
  render() {
    const { codes, countries, truncate = Infinity } = this.props;
    if (!codes) return null;

    let names = codes.map(code => (
      <Name countries={countries} code={code} key={code} />
    ));

    // Truncate if too long
    if (names.length > truncate) {
      const ellipsis = (
        <i key="ellipsis">
          … (
          <FormattedNumber value={codes.length} />
          &nbsp;
          <FormattedMessage id="Country.total" defaultMessage="total" />
          )
        </i>
      );
      // Cut slightly deeper than requested, as the ellipsis takes space too.
      const numberToKeep = truncate - 1;
      names = [...names.slice(0, numberToKeep), ellipsis];
    }

    return (
      <span>{ wordList(names, ', ') }</span>
    );
  }
}

const mapStateToProps = state => ({
  countries: state.metadata.countries,
});

class Country extends Component {
  static Name = connect(mapStateToProps)(Name);
  static List = connect(mapStateToProps)(List);
}

export default Country;

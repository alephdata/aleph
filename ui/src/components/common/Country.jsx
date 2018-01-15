import {FormattedMessage} from 'react-intl';

import wordList from 'src/util/wordList';
import React, { Component } from 'react';
import { connect } from 'react-redux';


class Name extends Component {
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
    const { codes, countries } = this.props;
    
    if (!codes) return null;
    const names = codes.map((code, i) => {
        return <Name countries={countries} code={code} key={code} />;
    });
    
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

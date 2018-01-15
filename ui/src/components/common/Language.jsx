import {FormattedMessage} from 'react-intl';

import wordList from 'src/util/wordList';
import React, { Component } from 'react';
import { connect } from 'react-redux';


class Name extends Component {
  render() {
    const { code, languages } = this.props,
          codeLabel = code ? code.toUpperCase() : <FormattedMessage id="language.unknown" defaultMessage="Unknown"/>,
          label = languages[code] || codeLabel;
    
    if (!code) return null;
    return (
      <span>{ label }</span>
    );
  }
}

class List extends Component {
  render() {
    const { codes, languages } = this.props;
    
    if (!codes) return null;
    const names = codes.map((code, i) => {
      return <Name languages={languages} code={code} key={code} />;
    });
    
    return (<span>{ wordList(names, ', ') }</span>);
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    languages: state.metadata.languages
  };
}

class Language extends Component {
  static Name = connect(mapStateToProps)(Name);
  static List = connect(mapStateToProps)(List);
}

export default Language;

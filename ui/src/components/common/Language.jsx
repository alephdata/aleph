import React, { PureComponent, Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import wordList from 'src/util/wordList';
import { selectMetadata } from 'src/selectors';


class Name extends PureComponent {
  render() {
    const { code, languages } = this.props;
    const codeLabel = code ? code.toUpperCase() : <FormattedMessage id="language.unknown" defaultMessage="Unknown" />;
    const label = languages[code] || codeLabel;

    if (!code) return null;
    return label;
  }
}

class List extends Component {
  render() {
    const { codes, languages } = this.props;
    if (!codes || codes.length === 0) {
      return null;
    }
    const names = codes.map(code => <Name languages={languages} code={code} key={code} />);
    return wordList(names, ', ');
  }
}

const mapStateToProps = state => ({
  languages: selectMetadata(state).languages,
});

class Language extends Component {
  static Name = connect(mapStateToProps)(Name);

  static List = connect(mapStateToProps)(List);
}

export default Language;

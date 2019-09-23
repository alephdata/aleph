import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { Count, Tag } from 'src/components/common';
import { Value } from 'src/components/Property/Value';
import wordList from 'src/util/wordList';
import ensureArray from 'src/util/ensureArray';
import getValueLink from 'src/util/getValueLink';
import { selectValueCount } from 'src/selectors';


class ValueLink extends Component {
  render() {
    const { value, prop, count } = this.props;
    const content = <Value value={value} prop={prop} />;
    if (count === null || count === 0) {
      return content;
    }
    const href = getValueLink(prop.type, value);
    return (
      <span className="ValueLink">
        <Link to={href}><Tag.Icon field={prop.type.group} /></Link>
        <Link to={href}>{content}</Link>
        <Count count={count} />
      </span>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { value, prop } = ownProps;
  return { count: selectValueCount(state, prop, value) };
};

ValueLink = connect(mapStateToProps)(ValueLink);
export { ValueLink };


export class ValueLinks extends Component {
  render() {
    const { prop, values, separator = ' · ' } = this.props;
    const vals = ensureArray(values).map(value => (
      <ValueLink key={value.id || value} prop={prop} value={value} />
    ));
    if (!vals.length) {
      return (<span className="no-value">—</span>);
    }
    return (<span>{ wordList(vals, separator) }</span>);
  }
}

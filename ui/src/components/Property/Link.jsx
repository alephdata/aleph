import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { Count } from 'src/components/common';
import { Value } from 'src/components/Property/Value';
import wordList from 'src/util/wordList';
import ensureArray from 'src/util/ensureArray';
import { selectValueCount } from 'src/selectors';


class ValueLink extends Component {
  render() {
    const { value, prop, count } = this.props;
    const content = <Value value={value} prop={prop} />;
    if (count === null || count === 0) {
      return content;
    }
    const href = `/search?facet=collection_id&facet_size:collection_id=10&facet_total:Acollection_id=true&filter:${prop.type.group}=${value}`;
    return (
      <Link to={href} className="ValueLink">
        {content}
        <Count count={count} />
      </Link>
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

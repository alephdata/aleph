import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Tooltip } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';

import { Count, Tag } from 'src/components/common';
import { Value } from 'src/components/Property/Value';
import wordList from 'src/util/wordList';
import ensureArray from 'src/util/ensureArray';
import getValueLink from 'src/util/getValueLink';
import { selectValueCount } from 'src/selectors';

const messages = defineMessages({
  tooltip: {
    id: 'valuelink.tooltip',
    defaultMessage: '{count} global mentions: {value}',
  },
});


class ValueLink extends Component {
  render() {
    const { intl, value, prop, count } = this.props;
    const content = <Value {...this.props} />;
    if (count === null || count === 0) {
      return content;
    }
    const href = getValueLink(prop.type, value);
    const values = { count, value };
    return (
      <span className="ValueLink">
        <Link to={href}><Tag.Icon field={prop.type.group} /></Link>
        <Link to={href}>{content}</Link>
        <Tooltip
          content={intl.formatMessage(messages.tooltip, values)}
          transitionDuration={0}
          hoverOpenDelay={100}
        >
          <Count count={count} />
        </Tooltip>
      </span>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { value, prop } = ownProps;
  return { count: selectValueCount(state, prop, value) };
};

ValueLink = connect(mapStateToProps)(ValueLink);
ValueLink = injectIntl(ValueLink);
export { ValueLink };


export class ValueLinks extends Component {
  render() {
    const { prop, values, separator = ' · ', missing = '—' } = this.props;
    const vals = ensureArray(values).map(value => (
      <ValueLink key={value.id || value} prop={prop} value={value} {...this.props} />
    ));
    if (!vals.length) {
      return (<span className="no-value">{missing}</span>);
    }
    return (<span>{ wordList(vals, separator) }</span>);
  }
}

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Tag as Bp3Tag, Tooltip } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';

import { Count, Property, Tag } from 'components/common';
import wordList from 'util/wordList';
import ensureArray from 'util/ensureArray';
import getValueLink from 'util/getValueLink';
import { selectValueCount, selectMetadata } from 'selectors';

import './Mention.scss';

const messages = defineMessages({
  tooltip: {
    id: 'valuelink.tooltip',
    defaultMessage: '{count} mentions in {appName}',
  },
});


class MentionLink extends Component {
  render() {
    const { intl, value, prop, count, metadata } = this.props;
    const content = <Property.Value {...this.props} />;
    if (count === null || count === 0) {
      return content;
    }

    const href = getValueLink(prop.type, value);
    return (
      <Tooltip
        content={intl.formatMessage(messages.tooltip, { count, appName: metadata.app.title })}
        transitionDuration={0}
        hoverOpenDelay={100}
      >
        <Link to={href} className="Mention">
          <Bp3Tag minimal interactive multiline>
            <Tag.Icon field={prop.type.group} />
            <span>{content}</span>
            <Count count={count} className="no-fill" />
          </Bp3Tag>
        </Link>
      </Tooltip>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { value, prop } = ownProps;

  return {
    count: selectValueCount(state, prop, value),
    metadata: selectMetadata(state),
  };
};

MentionLink = connect(mapStateToProps)(MentionLink);
MentionLink = injectIntl(MentionLink);

class MentionList extends Component {
  render() {
    const { prop, values, separator = ' · ', missing = '—' } = this.props;
    const vals = ensureArray(values).map(value => (
      <MentionLink key={value.id || value} prop={prop} value={value} {...this.props} />
    ));
    if (!vals.length) {
      return (<span className="no-value">{missing}</span>);
    }
    return (<span>{ wordList(vals, separator) }</span>);
  }
}

class Mention extends Component {
  static Link = MentionLink;
  static List = MentionList;
}

export default Mention;

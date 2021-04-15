import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

const messages = defineMessages({
  collapse: {
    id: 'timeline.button.collapse',
    defaultMessage: 'Show collapsed view',
  },
  show_full: {
    id: 'timeline.button.show_full',
    defaultMessage: 'Show detailed view',
  },
});


class TimelineActionBar extends Component {
  constructor(props) {
    super(props);
    this.toggleExpanded = this.toggleExpanded.bind(this);
  }

  toggleExpanded() {
    const { expandedMode, history, location } = this.props;
    history.push({
      ...location,
      hash: queryString.stringify({ expanded: !expandedMode })
    })
  }

  render() {
    const { expandedMode, createNewItem, disabled, intl, buttonGroupProps = {} } = this.props;

    return (
      <ButtonGroup className="TimelineActionBar" {...buttonGroupProps} >
        <Button icon={expandedMode ? 'collapse-all' : 'properties'} onClick={this.toggleExpanded}>
          {intl.formatMessage(messages[expandedMode ? 'collapse' : 'show_full'])}
        </Button>
        <Button icon="add" onClick={createNewItem} disabled={disabled} intent={Intent.PRIMARY}>
          <FormattedMessage id="timeline.add_new" defaultMessage="Create new item" />
        </Button>
      </ButtonGroup>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(TimelineActionBar);

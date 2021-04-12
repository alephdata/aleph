import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { queryEntities } from 'actions';


class TimelineActionBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
    };
    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  render() {
    const { createNewItem } = this.props;

    return (
      <ButtonGroup className="TimelineActionBar">
        <Button icon="add" onClick={createNewItem}>
          <FormattedMessage id="timeline.add_new" defaultMessage="Create new item" />
        </Button>
      </ButtonGroup>
    );
  }
}
export default compose(
  withRouter,
  connect(null, { queryEntities }),
  injectIntl,
)(TimelineActionBar);

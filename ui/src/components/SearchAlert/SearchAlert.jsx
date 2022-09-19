import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Classes } from '@blueprintjs/core';
import { Tooltip2 as Tooltip } from '@blueprintjs/popover2';
import c from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { createAlert, deleteAlert, queryAlerts } from 'actions';
import { selectSession, selectAlertResult } from 'selectors';
import { alertsQuery } from 'queries';
import validAlertQuery from 'util/validAlertQuery';

const messages = defineMessages({
  alert_add: {
    id: 'navbar.alert_add',
    defaultMessage:
      'Click to receive alerts about new results for this search.',
  },
  alert_remove: {
    id: 'navbar.alert_remove',
    defaultMessage: 'You are receiving alerts about this search.',
  },
});

class SearchAlert extends PureComponent {
  constructor(props) {
    super(props);
    this.onToggleAlert = this.onToggleAlert.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { loggedIn, query, result } = this.props;
    if (loggedIn && result.shouldLoad) {
      this.props.queryAlerts({ query, result });
    }
  }

  async onToggleAlert(event) {
    event.preventDefault();
    const { result, alertQuery } = this.props;
    const alertExists = this.alertExists();

    if (result.isPending || !validAlertQuery(alertQuery)) {
      return false;
    }

    if (alertExists) {
      await Promise.all(
        result.results.reduce((pool, alert) => {
          if (alert.query.trim() === alertQuery.trim()) {
            pool.push(this.props.deleteAlert(alert.id));
          }
          return pool;
        }, [])
      );
    } else {
      await this.props.createAlert({ query: alertQuery.trim() });
    }
  }

  alertExists() {
    const { alertQuery, result, loggedIn } = this.props;
    if (!loggedIn || result.isPending || !validAlertQuery(alertQuery)) {
      return false;
    }
    return !!result.results.some(
      (a) => a.query && a.query.trim() === alertQuery.trim()
    );
  }

  render() {
    const { alertQuery, loggedIn, intl } = this.props;
    if (!loggedIn || !validAlertQuery(alertQuery)) {
      return null;
    }
    const alertExists = this.alertExists();
    const className = c(
      Classes.BUTTON,
      Classes.MINIMAL,
      Classes.SMALL,
      alertExists && Classes.INTENT_PRIMARY,
      alertExists ? `${Classes.ICON}-feed-subscribed` : `${Classes.ICON}-feed`
    );
    const tooltip = alertExists
      ? intl.formatMessage(messages.alert_remove)
      : intl.formatMessage(messages.alert_add);
    return (
      <Tooltip content={tooltip}>
        <button
          className={className}
          type="button"
          onClick={this.onToggleAlert}
        />
      </Tooltip>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = alertsQuery(location);
  return {
    query,
    result: selectAlertResult(state, query),
    loggedIn: selectSession(state).loggedIn,
  };
};

const mapDispatchToProps = { createAlert, deleteAlert, queryAlerts };
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(SearchAlert);

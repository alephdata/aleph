import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { Tooltip } from '@blueprintjs/core';
import c from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { addAlert, deleteAlert, fetchAlerts } from 'actions';
import { selectSession, selectAlerts } from 'selectors';


const messages = defineMessages({
  alert_add: {
    id: 'navbar.alert_add',
    defaultMessage: 'Click to receive alerts about new results for this search.',
  },
  alert_remove: {
    id: 'navbar.alert_remove',
    defaultMessage: 'You are receiving alerts about this search.',
  },
});


class SearchAlert extends Component {
  static doesAlertExist({ alertQuery, session, alerts }) {
    if (!session.loggedIn || !alerts || !alerts.results || !alertQuery) {
      return false;
    }
    return !!alerts.results.some(a => a.query && a.query.trim() === alertQuery.trim());
  }

  constructor(props) {
    super(props);
    this.state = { updating: false };
    this.onToggleAlert = this.onToggleAlert.bind(this);
  }

  componentDidMount() {
    const { session, alerts } = this.props;
    if (session.loggedIn && alerts.shouldLoad && (!alerts || !alerts.results)) {
      this.props.fetchAlerts();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.state.updating !== nextState.updating) {
      return true;
    }

    return !this.props.alerts
      || this.props.alerts.total !== nextProps.alerts.total
      || this.props.alertQuery !== nextProps.alertQuery;
  }

  async onToggleAlert(event) {
    event.preventDefault();
    const { alerts, alertQuery } = this.props;
    const alertExists = this.alertExists();

    if (!alerts || !alerts.results || this.state.updating) {
      return false;
    }

    this.setState({ updating: true });
    if (alertExists) {
      await Promise.all(alerts.results.reduce((pool, alert) => {
        if (alert.query.trim() === alertQuery.trim()) {
          pool.push(
            this.props.deleteAlert(alert.id),
            this.props.fetchAlerts(),
          );
        }
        return pool;
      }, []));
    } else {
      await this.props.addAlert({ query: alertQuery.trim() });
      await this.props.fetchAlerts();
    }

    this.setState({ updating: false });
    return undefined;
  }

  alertExists() {
    return SearchAlert.doesAlertExist(this.props);
  }

  render() {
    const { alertQuery, session, intl } = this.props;
    if (!session.loggedIn || !alertQuery || !alertQuery.trim().length) {
      return null;
    }
    const alertExists = this.alertExists();
    const className = c('bp3-button',
      'bp3-minimal',
      { 'bp3-icon-feed': !alertExists },
      { 'bp3-icon-feed-subscribed': alertExists },
      'bp3-small',
      { 'bp3-intent-primary': alertExists },
      { 'bp3-disabled': this.state.updating });
    const tooltip = alertExists ? intl.formatMessage(messages.alert_remove)
      : intl.formatMessage(messages.alert_add);
    return (
      <Tooltip content={tooltip}>
        <button className={className} type="button" onClick={this.onToggleAlert} />
      </Tooltip>
    );
  }
}

const mapStateToProps = state => ({
  alerts: selectAlerts(state),
  session: selectSession(state),
});

const mapDispatchToProps = { addAlert, deleteAlert, fetchAlerts };
export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(SearchAlert);

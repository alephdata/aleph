import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { ControlGroup, InputGroup, Button, Intent } from '@blueprintjs/core';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ErrorSection, SearchListings } from 'components/common';
import { fetchAlerts, addAlert, deleteAlert } from 'actions';

import './AlertsManager.scss';


const messages = defineMessages({
  title: {
    id: 'alerts.heading',
    defaultMessage: 'Manage your alerts',
  },
  save_button: {
    id: 'alerts.save',
    defaultMessage: 'Update',
  },
  add_placeholder: {
    id: 'alerts.add_placeholder',
    defaultMessage: 'Create a new tracking alert...',
  },
  no_alerts: {
    id: 'alerts.no_alerts',
    defaultMessage: 'You are not tracking any searches',
  },
});

class AlertsDialog extends Component {
  constructor(props) {
    super(props);
    this.state = { newAlert: '' };

    this.onDeleteAlert = this.onDeleteAlert.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
  }

  componentDidMount() {
    const { alerts } = this.props;
    if (alerts.total === undefined) {
      this.props.fetchAlerts();
    }
  }

  async onDeleteAlert(id) {
    await this.props.deleteAlert(id);
    await this.props.fetchAlerts();
  }

  async onAddAlert(event) {
    const { newAlert } = this.state;
    event.preventDefault();
    this.setState({ newAlert: '' });
    if (!newAlert.split().length) {
      return;
    }
    await this.props.addAlert({ query: newAlert });
    await this.props.fetchAlerts();
  }

  onSearch(alert) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: alert,
      }),
    });
  }

  onChangeAddingInput({ target }) {
    this.setState({ newAlert: target.value });
  }

  render() {
    const { alerts, intl } = this.props;
    const { newAlert } = this.state;

    return (
      <div className="AlertsManager">
        <form onSubmit={this.onAddAlert} className="add-form">
          <ControlGroup fill>
            <InputGroup
              leftIcon="feed"
              placeholder={intl.formatMessage(messages.add_placeholder)}
              onChange={this.onChangeAddingInput}
              value={newAlert}
              autoFocus
              large
            />
            <Button
              disabled={newAlert.length === 0}
              onClick={this.onAddAlert}
              intent={Intent.PRIMARY}
              text={<FormattedMessage id="alerts.track" defaultMessage="Track" />}
              large
            />
          </ControlGroup>
        </form>
        { alerts.page !== undefined && !alerts.results.length && (
          <ErrorSection
            icon="feed"
            title={intl.formatMessage(messages.no_alerts)}
          />
        )}
        <SearchListings
          listType="alerts"
          result={alerts}
          onDelete={item => this.onDeleteAlert(item.id)}
          onSearch={item => this.onSearch(item.query)}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  alerts: state.alerts,
});
const mapDispatchToProps = {
  fetchAlerts, addAlert, deleteAlert,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(AlertsDialog);

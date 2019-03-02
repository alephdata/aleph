import React, { Component } from 'react';
import { Button, Tooltip, H4 } from '@blueprintjs/core';
import { defineMessages, FormattedMessage } from 'react-intl';
import queryString from 'query-string';

import { DualPane, ErrorSection } from 'src/components/common';
import { fetchAlerts, addAlert, deleteAlert } from 'src/actions';

import './AlertsManager.scss';
import { enhancer } from 'src/util/enhancers';

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
    defaultMessage: 'Keep track of searches...',
  },
  no_alerts: {
    id: 'alerts.no_alerts',
    defaultMessage: 'You are not tracking any searches',
  },
  search_alert: {
    id: 'alerts.alert.search',
    defaultMessage: 'Search for {query}',
  },
  delete_alert: {
    id: 'alerts.alert.delete',
    defaultMessage: 'Stop tracking',
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
      <DualPane.SidePane className="AlertsManager">
        <div className="bp3-callout bp3-intent-primary">
          <H4 className="bp3-callout-title">
            <FormattedMessage id="alert.manager.title" defaultMessage="Tracking alerts" />
          </H4>
          <FormattedMessage id="alert.manager.description" defaultMessage="You will receive notifications when a new document or entity matches any of the alerts you have set up below." />
        </div>
        <form onSubmit={this.onAddAlert} className="add-form">
          <div className="bp3-control-group bp3-fill">
            <div className="bp3-input-group bp3-fill">
              <input
                type="text"
                className="bp3-input"
                autoComplete="off"
                placeholder={intl.formatMessage(messages.add_placeholder)}
                onChange={this.onChangeAddingInput}
                value={newAlert}
              />
            </div>
            <button
              type="button"
              className="bp3-button bp3-fixed"
              disabled={newAlert.length === 0}
              onClick={this.onAddAlert}
            >
              <FormattedMessage id="alerts.add" defaultMessage="Add alert" />
            </button>
          </div>
        </form>
        { alerts.page !== undefined && !alerts.results.length && (
          <ErrorSection
            visual="eye-off"
            title={intl.formatMessage(messages.no_alerts)}
          />
        )}
        { alerts.page !== undefined && alerts.results.length > 0 && (
          <table className="alerts-table settings-table">
            <tbody>
              {alerts.results.map(item => (
                <tr key={item.id}>
                  <td className="alert-label">
                    {item.query}
                  </td>
                  <td className="narrow">
                    <Tooltip
                      content={intl.formatMessage(messages.search_alert, { query: item.query })}
                    >
                      <Button
                        icon="search"
                        minimal
                        small
                        onClick={() => this.onSearch(item.query)}
                      />
                    </Tooltip>
                  </td>
                  <td className="narrow">
                    <Tooltip content={intl.formatMessage(messages.delete_alert)}>
                      <Button
                        icon="cross"
                        minimal
                        small
                        onClick={() => this.onDeleteAlert(item.id)}
                      />
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DualPane.SidePane>
    );
  }
}

const mapStateToProps = state => ({
  alerts: state.alerts,
});

export default enhancer({
  mapStateToProps,
  mapDispatchToProps: {
    fetchAlerts, addAlert, deleteAlert,
  },
})(AlertsDialog);

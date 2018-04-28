import React, {Component} from 'react';
import { Button, Tooltip } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { fetchAlerts, addAlert, deleteAlert } from 'src/actions';

import './AlertsManager.css';

const messages = defineMessages({
  title: {
    id: 'alerts.title',
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
    id: 'alerts.search_alert',
    defaultMessage: 'Search for {label}',
  },
  delete_alert: {
    id: 'alerts.search_alert',
    defaultMessage: 'Stop tracking',
  }
});

class AlertsDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {newAlert: ''};

    this.onDeleteAlert = this.onDeleteAlert.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
  }

  componentDidMount() {
    const { alerts, fetchAlerts } = this.props;
    if (alerts.total === undefined) {
      fetchAlerts();
    }
  }

  async onDeleteAlert(id, event) {
    await this.props.deleteAlert(id);
    await this.props.fetchAlerts();
  }

  async onAddAlert(event) {
    const { newAlert } = this.state;
    event.preventDefault();
    this.setState({newAlert: ''});
    await this.props.addAlert({query_text: newAlert});
    await this.props.fetchAlerts();
  }

  onSearch(alert) {
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: alert
      })
    });
  }

  onChangeAddingInput({target}) {
    this.setState({newAlert: target.value});
  }

  render() {
    const {alerts, intl} = this.props;
    return (
      <DualPane.InfoPane className="AlertsManager with-heading">
        <div className="pane-heading">
          <h1>
            <FormattedMessage id="alerts.title" defaultMessage="Your notifications"/>
          </h1>
        </div>
        <div className="pane-content">
          <form onSubmit={this.onAddAlert}>
            <div className="pt-control-group pt-fill add-form">
              <div className="pt-input-group pt-large pt-fill">
                <input type="text"
                  autoFocus={true}
                  className="pt-input"
                  autoComplete="off"
                  placeholder={intl.formatMessage(messages.add_placeholder)}
                  onChange={this.onChangeAddingInput}
                  value={this.state.newAlert} />
              </div>
              <button className="pt-button pt-large pt-fixed" onClick={this.onAddAlert}>
                <FormattedMessage id="alerts.add" defaultMessage="Add alert"/>
              </button>
            </div>
          </form>
          { alerts.page === undefined && (
            <SectionLoading />
          )}
          { alerts.page !== undefined && !alerts.results.length && (
            <ErrorSection visual="eye-off"
                          title={intl.formatMessage(messages.no_alerts)}/>
          )}
          { alerts.page !== undefined && alerts.results.length > 0 && (
            <table className="alerts-table settings-table">
              <tbody>
                {alerts.results.map((item) => (
                  <tr key={item.id}>
                    <td className="alert-label">
                      {item.label}
                    </td>
                    <td className="narrow">
                      <Tooltip content={intl.formatMessage(messages.search_alert, {label: item.label})}>
                        <Button icon="search" minimal={true} small={true}
                                onClick={() => this.onSearch(item.label)} />
                      </Tooltip>
                    </td>
                    <td className="narrow">
                      <Tooltip content={intl.formatMessage(messages.delete_alert)}>
                        <Button icon="cross" minimal={true} small={true}
                                onClick={() => this.onDeleteAlert(item.id)} />
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  alerts: state.alerts
});

AlertsDialog = injectIntl(AlertsDialog);
AlertsDialog = withRouter(AlertsDialog);
export default connect(mapStateToProps, {fetchAlerts, addAlert, deleteAlert})(AlertsDialog);

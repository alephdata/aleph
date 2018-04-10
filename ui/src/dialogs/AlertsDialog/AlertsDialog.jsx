import React, {Component} from 'react';
import { NonIdealState, Dialog } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { SectionLoading } from 'src/components/common';
import {fetchAlerts, addAlert, deleteAlert} from 'src/actions';

import './AlertsDialog.css';

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
    defaultMessage: 'Receive e-mail when there are new results.',
  },
  no_alerts: {
    id: 'alerts.no_alerts',
    defaultMessage: 'You have no notifications set up.',
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
      <Dialog icon="notifications" className="AlertsDialog"
              isOpen={this.props.isOpen}
              onClose={this.props.toggleDialog}
              title={intl.formatMessage(messages.title)}>
        <div className="pt-dialog-body">
          <form onSubmit={this.onAddAlert}>
            <div className="pt-control-group pt-fill">
              <div className="pt-input-group pt-large pt-fill">
                <input type="text"
                  autoFocus={true}
                  className="pt-input"
                  autoComplete="off"
                  placeholder={intl.formatMessage(messages.add_placeholder)}
                  onChange={this.onChangeAddingInput}
                  value={this.state.newAlert} />
              </div>
              <button className="pt-button pt-large pt-fixed pt-intent-primary" onClick={this.onAddAlert}>
                <FormattedMessage id="alerts.add" defaultMessage="Add alert"/>
              </button>
            </div>
          </form>
          { alerts.page === undefined && (
            <SectionLoading />
          )}
          { alerts.page !== undefined && !alerts.results.length && (
            <NonIdealState visual="eye-off"
                           title={intl.formatMessage(messages.no_alerts)}/>
          )}
          { alerts.page !== undefined && alerts.results.length > 0 && (
            <table className="AlertsTable settings-table">
              <thead>
                <tr>
                  <th>
                    <FormattedMessage id="alerts.topic" defaultMessage="Topic"/>
                  </th>
                  <th className="narrow">
                    <FormattedMessage id="alerts.search" defaultMessage="Search"/>
                  </th>
                  <th className="narrow">
                    <FormattedMessage id="alerts.delete" defaultMessage="Delete"/>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.results.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.label}
                    </td>
                    <td onClick={() => this.onSearch(item.label)} className="toggle">
                      <i className="fa fa-search" aria-hidden="true"/>
                    </td>
                    <td onClick={() => this.onDeleteAlert(item.id)} className="toggle">
                      <i className="fa fa-trash-o" aria-hidden="true"/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  alerts: state.alerts
});

AlertsDialog = injectIntl(AlertsDialog);
AlertsDialog = withRouter(AlertsDialog);
export default connect(mapStateToProps, {fetchAlerts, addAlert, deleteAlert})(AlertsDialog);

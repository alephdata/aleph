import React, {Component} from 'react';
import {Button} from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import {connect} from 'react-redux';

import {fetchAlerts, addAlert, deleteAlert} from 'src/actions';
import DualPane from 'src/components/common/DualPane';
import AlertsTable from './AlertsTable';
import {showSuccessToast} from "../../app/toast";

import './AlertsPane.css';

const messages = defineMessages({
  add_placeholder: {
    id: 'alerts.add_placeholder',
    defaultMessage: 'Subscribe to notifications',
  },
  update_success: {
    id: 'alerts.update_success',
    defaultMessage: 'You have updated your alerts!',
  },
});

class AlertsPane extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newAlert: '',
    };

    this.deleteAlert = this.deleteAlert.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
  }

  componentDidMount() {
    this.props.fetchAlerts();
  }

  async deleteAlert(id, event) {
    await this.props.deleteAlert(id);
    await this.props.fetchAlerts();
  }

  async onAddAlert(event) {
    const { intl } = this.props;
    event.preventDefault();
    await this.props.addAlert({query_text: this.state.newAlert});
    await this.props.fetchAlerts();
    showSuccessToast(intl.formatMessage(messages.update_success));
    this.setState({newAlert: ''});
  }

  onChangeAddingInput({target}) {
    this.setState({newAlert: target.value});
  }

  render() {
    const {alerts, intl} = this.props;

    return (
      <DualPane.ContentPane limitedWidth={true} className="AlertsPane">
        <h1>
          <FormattedMessage id="alerts.title"
                            defaultMessage="Alerts & Notifications"/>
        </h1>
        <form onSubmit={this.onAddAlert} className="add-topic-form">
          <input
            className="pt-input add-topic-input"
            placeholder={intl.formatMessage(messages.add_placeholder)}
            type="text"
            dir="auto"
            autoComplete="off"
            onChange={this.onChangeAddingInput}
            value={this.state.newAlert}
          />
          <Button className="add-topic-button" onClick={this.onAddAlert}>
            <FormattedMessage id="alerts.add"
                              defaultMessage="Add"/>
          </Button>
        </form>
        <AlertsTable alerts={alerts} deleteAlert={this.deleteAlert} />
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
    alerts: state.alerts,
});

AlertsPane = injectIntl(AlertsPane);
export default connect(mapStateToProps, {fetchAlerts, addAlert, deleteAlert})(AlertsPane);

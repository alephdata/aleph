import React, {Component} from 'react';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import queryString from 'query-string';

import {fetchAlerts, addAlert, deleteAlert} from 'src/actions';
import DualPane from 'src/components/common/DualPane';
import AlertsTable from './AlertsTable';

import './AlertsPane.css';

class AlertsPane extends Component {

  constructor(props) {
    super(props);

    this.state = {
      newAlert: '',
    };

    this.deleteAlert = this.deleteAlert.bind(this);
    this.onAddAlert = this.onAddAlert.bind(this);
    this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  componentDidMount() {
    this.props.fetchAlerts();
  }

  async deleteAlert(id, event) {
    await this.props.deleteAlert(id);
    await this.props.fetchAlerts();
  }

  async onAddAlert(event) {
    event.preventDefault();
    await this.props.addAlert({query_text: this.state.newAlert});
    await this.props.fetchAlerts();
    this.setState({newAlert: ''});
  }

  onChangeAddingInput({target}) {
    this.setState({newAlert: target.value});
  }

  onSearch(alert) {
    const {history} = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: alert
      })
    });
  }

  render() {
    const {alerts, intl} = this.props;
    const hasAlerts = !(alerts.results !== undefined && alerts.results.length === 0);

    return (
      <DualPane.ContentPane isLimited={true} className="AlertsPane">
        <div className='main_div'>
          <div className='title_div'>
            <h1 className='alerts_title'>
              Alerts & Notifications
            </h1>
          </div>
          {/*<div className='title_div'>
            <h1 className='alerts_title'>
              Alerts & Notifications
            </h1>
            <div className="pt-form-content search_alerts">
              <input id="filter_alerts" className="pt-input search_alerts_input"
                   placeholder="Filter alerts" type="text" dir="auto"/>
            </div>
          </div>*/}
          <div className='add_topic_div'>
            <form onSubmit={this.onAddAlert} className="search_form">
              <div className="pt-form-content add_topic">
                <input
                  id="add_alert"
                  className="pt-input add_topic_input"
                  placeholder={intl.formatMessage({
                  id: "alerts.topic.desc",
                  defaultMessage: "Add topic to the list"
                  })}
                  type="text"
                  dir="auto"
                  onChange={this.onChangeAddingInput}
                  value={this.state.newAlert}
                />
                <div
                  className="pt-button-group pt-fill alerts_button_div"
                  onClick={this.onAddAlert}
                >
                  <AnchorButton>
                    <FormattedMessage id="alerts.add" defaultMessage="Add"/>
                  </AnchorButton>
                </div>
              </div>
            </form>
          </div>
        </div>
        <AlertsTable alerts={alerts} hasAlerts={hasAlerts} deleteAlert={this.deleteAlert} onSearch={this.onSearch}/>
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
    alerts: state.alerts,
});

AlertsPane = injectIntl(AlertsPane);
export default connect(mapStateToProps, {fetchAlerts, addAlert, deleteAlert})(AlertsPane);

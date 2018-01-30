import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';

class AlertsTable extends Component {

  constructor(props) {
    super(props);

    this.deleteAlert = this.deleteAlert.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  async deleteAlert(id, event) {
    this.props.deleteAlert(id);
  }

  onSearch(alert) {
    this.props.onSearch(alert);
  }

  render() {
    const {hasAlerts, alerts} = this.props;

    if (!hasAlerts || alerts.results === undefined) {
      return <NonIdealState visual="" title="There are no alerts"/>
    } else {
      return <div>
        <div className='header_alerts'>
          <p className='header_label header_topic'>
            <FormattedMessage id="alerts.topic" defaultMessage="Topic"/>
          </p>
          <p className='header_label header_delete_search'>
            <FormattedMessage id="alerts.search" defaultMessage="Search"/>
          </p>
          <p className='header_label header_delete_search'>
            <FormattedMessage id="alerts.delete" defaultMessage="Delete"/>
          </p>
        </div>
        <div className='table_body_alerts'>
          {alerts.results.map((item, index) => (
            <div key={index} className='table_row'>
              <p className='table_item_alert header_topic'>
                {item.label}
              </p>
              <p className='table_item_alert header_delete_search'
                 onClick={() => this.onSearch(item.label)}>
                <i className="fa fa-search" aria-hidden="true"/>
              </p>
              <p
                key={index}
                className='table_item_alert header_delete_search'
                onClick={() => this.deleteAlert(item.id)}
              >
                <i className="fa fa-trash-o" aria-hidden="true"/>
              </p>
            </div>
          ))}
        </div>
      </div>
    }
  }
}

export default AlertsTable;

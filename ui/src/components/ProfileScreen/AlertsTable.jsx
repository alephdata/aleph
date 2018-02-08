import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';
import {withRouter} from 'react-router';
import queryString from 'query-string';

import './AlertsTable.css';

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
    const { history } = this.props;
    history.push({
      pathname: '/search',
      search: queryString.stringify({
        q: alert
      })
    });
  }

  render() {
    const { alerts } = this.props;

    if (alerts.results === undefined || alerts.results.length === 0) {
      return (
        <div>
          <NonIdealState visual="" title="There are no alerts"/>
        </div>
      );
    }

    return (
      <table className="AlertsTable data-table">
        <thead>
          <tr>
            <th className='topic'>
              <FormattedMessage id="alerts.topic" defaultMessage="Topic"/>
            </th>
            <th>
              <FormattedMessage id="alerts.search" defaultMessage="Search"/>
            </th>
            <th>
              <FormattedMessage id="alerts.delete" defaultMessage="Delete"/>
            </th>
          </tr>
        </thead>
        <tbody className='table_body_alerts'>
          {alerts.results.map((item) => (
            <tr key={item.id} className='table_row'>
              <td className='table_item_alert header_topic'>
                {item.label}
              </td>
              <td className='buttonCell'
                  onClick={() => this.onSearch(item.label)}>
                <i className="fa fa-search" aria-hidden="true"/>
              </td>
              <td
                className='buttonCell'
                onClick={() => this.deleteAlert(item.id)}
              >
                <i className="fa fa-trash-o" aria-hidden="true"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }
}

export default withRouter(AlertsTable);
